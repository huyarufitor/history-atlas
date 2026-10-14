import { expect, test } from '@playwright/test'

test('苏联前后地图、搜索和2026年覆盖提示', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.locator('path.country').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: '苏联解体', exact: true })).toBeVisible()
  await expect(page.locator('[data-country="Ukraine"]')).toHaveCount(0)
  await page.getByRole('button', { name: '变化后' }).click()
  await expect(page.locator('[data-country="Ukraine"]')).toHaveCount(1)
  const search = page.getByRole('textbox', { name: '搜索当前地图的国家或地区' })
  await search.fill('乌克兰')
  await page.locator('.search-results button').first().click()
  await expect(page.locator('.country-card h3')).toHaveText('乌克兰')
  await page.getByRole('spinbutton', { name: '选择年份' }).fill('2026')
  await page.getByRole('spinbutton', { name: '选择年份' }).press('Enter')
  await expect(page.getByText('2026 年边界数据待补充')).toBeVisible()
  await expect(page.locator('.snapshot-chip')).toContainText('2026.12.31')
  await expect(page.locator('path.country')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('德国帝制变化不改变边界、统一改变边界', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('path.country').first()).toBeVisible()
  await page.getByRole('button', { name: '1918年：德意志帝国终结', exact: true }).click()
  await expect(page.locator('.event-panel h2')).toHaveText('德意志帝国终结')
  const before = await page.locator('[data-country="Germany (Prussia)"]').getAttribute('d')
  await page.getByRole('button', { name: '变化后' }).click()
  expect(await page.locator('[data-country="Germany (Prussia)"]').getAttribute('d')).toBe(before)
  await page.getByRole('button', { name: '1990年：德国重新统一', exact: true }).click()
  await expect(page.locator('[data-country="German Democratic Republic"]')).toHaveCount(1)
  await page.getByRole('button', { name: '变化后' }).click()
  await expect(page.locator('[data-country="German Democratic Republic"]')).toHaveCount(0)
})

test('时间轴、播放暂停和弹窗键盘操作', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('path.country').first()).toBeVisible()
  const slider = page.getByRole('slider', { name: '历史年份时间轴' })
  await slider.fill('1900')
  await expect(page.locator('.snapshot-chip')).toContainText('1900.12.31')
  await page.getByRole('button', { name: '播放历史', exact: true }).click()
  await expect(page.getByRole('spinbutton', { name: '选择年份' })).not.toHaveValue('1900', {
    timeout: 4000,
  })
  await page.getByRole('button', { name: '暂停历史播放' }).click()
  await page.getByRole('button', { name: '关于这份地图' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: '关于这份地图' })).toBeFocused()
})

test('移动端没有横向溢出且可以操作专题', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('path.country').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.getByRole('button', { name: '历史专题', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: /南苏丹独立/ }).click()
  await expect(page.locator('.event-panel h2')).toHaveText('南苏丹独立')
  await page.getByRole('button', { name: '变化后' }).click()
  await expect(page.locator('[data-country="South Sudan"]')).toHaveCount(1)
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true })
})

test('地图加载失败时可以重试', async ({ page }) => {
  await page.route('**/data/borders.geojson', (route) =>
    route.fulfill({ status: 503, body: 'Unavailable' }),
  )
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('地图数据暂时无法读取')
  await page.unroute('**/data/borders.geojson')
  await page.getByRole('button', { name: '重新加载' }).click()
  await expect(page.locator('path.country').first()).toBeVisible()
})

test('桌面地图可视与区域缩放', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/')
  await expect(page.locator('path.country').first()).toBeVisible()
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true })
  await page.getByRole('button', { name: '放大地图' }).click()
  await page.getByRole('button', { name: '重置世界视图' }).click()
  await page.getByRole('combobox', { name: '地图区域' }).selectOption('europe')
  await expect(page.locator('.world-map svg>g')).toHaveAttribute('transform', /scale\(3\)/)
})

test('按日查看、来源核查与边界版本跳转', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('path.country').first()).toBeVisible()
  const date = page.getByLabel('选择具体日期')
  await date.fill('1990-10-02')
  await expect(page.locator('[data-country="German Democratic Republic"]')).toHaveCount(1)
  await date.fill('1990-10-03')
  await expect(page.locator('[data-country="German Democratic Republic"]')).toHaveCount(0)
  await page.getByRole('textbox', { name: '搜索当前地图的国家或地区' }).fill('德国')
  await page.locator('.search-results button').first().click()
  await page.getByRole('button', { name: '查看边界版本与来源' }).click()
  await expect(page.getByRole('dialog')).toContainText('逐条史料复核尚未完成')
  await expect(page.locator('.record-row')).not.toHaveCount(0)
})

test('查阅证据时冻结播放，跨越资料缺口后保留区域', async ({ page }) => {
  await page.clock.install()
  await page.goto('/')
  await expect(page.locator('path.country').first()).toBeVisible()
  await page.getByRole('button', { name: '播放历史', exact: true }).click()
  await page.getByRole('textbox', { name: '搜索当前地图的国家或地区' }).fill('美国')
  await page.locator('.search-results button').first().click()
  await page.getByRole('button', { name: '查看边界版本与来源' }).click()
  await page.clock.runFor(1300)
  await expect(page.locator('.record-row')).toHaveCount(3)
  await expect(page.getByRole('button', { name: '播放历史', exact: true })).toHaveCount(1)
  await page.keyboard.press('Escape')
  await page.getByRole('combobox', { name: '地图区域' }).selectOption('europe')
  await page.getByLabel('选择具体日期').fill('2026-01-01')
  await page.getByRole('button', { name: '查看 2019 年来源地图' }).click()
  await expect(page.locator('.world-map svg>g')).toHaveAttribute('transform', /scale\(3\)/)
})
