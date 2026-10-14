import { describe, expect, it } from 'vitest'
import {
  clampYear,
  dateForYear,
  resolveDate,
  activeAt,
  displayName,
  isValidDate,
} from '../src/history'

describe('历史日期口径', () => {
  it('接受真实日历日期并拒绝伪造的精确日期', () => {
    expect(isValidDate('1991-12-26')).toBe(true)
    expect(isValidDate('2000-02-29')).toBe(true)
    expect(isValidDate('1900-02-29')).toBe(false)
    expect(isValidDate('1991-13-01')).toBe(false)
    expect(isValidDate('1899-12-31')).toBe(false)
    expect(isValidDate('2027-01-01')).toBe(false)
    expect(isValidDate('')).toBe(false)
  })
  it('正常年份查看年末，不把未来年份作为已知地图', () => {
    expect(dateForYear(1991)).toBe('1991-12-31')
    expect(resolveDate('2026-12-31')).toEqual({ date: '2026-12-31', available: false })
    expect(resolveDate('1900-01-01')).toEqual({ date: '1900-01-01', available: true })
  })
  it('有效期包含首尾日期，跨界当天不重复计算旧记录', () => {
    const old = { start: '1945-08-15', end: '1991-08-24' }
    const next = { start: '1991-08-25', end: '1991-08-31' }
    expect(activeAt(old, '1991-08-24')).toBe(true)
    expect(activeAt(old, '1991-08-25')).toBe(false)
    expect(activeAt(next, '1991-08-25')).toBe(true)
  })
  it('将年份限制在展示范围，非法输入回到起始年份', () => {
    expect(clampYear(1890)).toBe(1900)
    expect(clampYear(2030)).toBe(2026)
    expect(clampYear(Number.NaN)).toBe(1900)
    expect(clampYear(1991.8)).toBe(1991)
  })
  it('政体名称随事件日期变化，不将同一国界等同于同一政体', () => {
    expect(displayName('Russia (Soviet Union)', '1900-12-31')).toBe('俄罗斯帝国')
    expect(displayName('Russia (Soviet Union)', '1991-08-01')).toBe('苏联')
    expect(displayName('Russia (Soviet Union)', '1991-12-31')).toBe('俄罗斯')
    expect(displayName('Germany (Prussia)', '1918-11-08')).toBe('德意志帝国')
    expect(displayName('Germany (Prussia)', '1918-11-10')).toBe('德国（共和国过渡期）')
    expect(displayName('Germany (Prussia)', '1920-01-01')).toBe('德国（魏玛共和国）')
  })
})
