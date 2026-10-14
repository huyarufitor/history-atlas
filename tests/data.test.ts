import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { geoArea } from 'd3-geo'
import { activeAt, type Border } from '../src/history'
import { events } from '../src/events'
const borders: Border[] = JSON.parse(
  readFileSync(new URL('../public/data/borders.geojson', import.meta.url), 'utf8'),
).features
const at = (date: string) => borders.filter((f) => activeAt(f.properties, date))
const named = (date: string, name: string) => at(date).find((f) => f.properties.name === name)
describe('真实历史边界数据', () => {
  it('所有年份都有边界且同一政治实体在同一天不重复', () => {
    for (let y = 1900; y <= 2019; y++) {
      const features = at(`${y}-12-31`)
      expect(features.length).toBeGreaterThan(90)
      expect(new Set(features.map((f) => f.properties.code)).size).toBe(features.length)
    }
  })
  it('德国统一当天东德边界消失，西德记录扩展', () => {
    expect(named('1990-10-02', 'German Democratic Republic')).toBeDefined()
    expect(named('1990-10-03', 'German Democratic Republic')).toBeUndefined()
    expect(named('1990-10-03', 'German Federal Republic')!.properties.area).toBeGreaterThan(
      named('1990-10-02', 'German Federal Republic')!.properties.area,
    )
  })
  it('1991年内苏联边界缩小，乌克兰与哈萨克斯坦出现', () => {
    expect(named('1991-01-01', 'Ukraine')).toBeUndefined()
    expect(named('1991-12-31', 'Ukraine')).toBeDefined()
    expect(named('1991-12-31', 'Kazakhstan')).toBeDefined()
    expect(named('1991-12-31', 'Russia (Soviet Union)')!.properties.area).toBeLessThan(
      named('1991-01-01', 'Russia (Soviet Union)')!.properties.area,
    )
  })
  it('南苏丹独立日出现，苏丹面积对应缩小', () => {
    expect(named('2011-07-08', 'South Sudan')).toBeUndefined()
    expect(named('2011-07-09', 'South Sudan')).toBeDefined()
    expect(named('2011-07-09', 'Sudan')!.properties.area).toBeLessThan(
      named('2011-07-08', 'Sudan')!.properties.area,
    )
  })
  it('1918年帝制结束不伪造德国边界变化', () => {
    expect(named('1918-11-08', 'Germany (Prussia)')!.id).toBe(
      named('1918-11-10', 'Germany (Prussia)')!.id,
    )
  })
  it('多边形方向不会误将国家绘制成整个地球的补集', () => {
    expect(borders.every((f) => geoArea(f) < 2 * Math.PI)).toBe(true)
  })
  it('专题对比日期有序、来源完整且各专题能关联地图要素', () => {
    for (const event of events) {
      expect(event.before < event.after).toBe(true)
      expect(event.source.startsWith('https://')).toBe(true)
      expect(
        at(event.before)
          .concat(at(event.after))
          .some((f) => event.countries.includes(f.properties.name)),
      ).toBe(true)
    }
  })
})
