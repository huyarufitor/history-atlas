import type { Feature, MultiPolygon, Polygon } from 'geojson'
export type BorderProperties = {
  name: string
  code: number
  start: string
  end: string
  area: number
  capital: string
  capitalPoint: [number, number]
  geometryId: string
  sourceRecord: number
}
export type Border = Feature<Polygon | MultiPolygon, BorderProperties>
export const MIN_YEAR = 1900
export const MAX_YEAR = 2026
export const DATA_END = '2019-12-31'
export function clampYear(year: number): number {
  return Number.isFinite(year) ? Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.trunc(year))) : MIN_YEAR
}
export function dateForYear(year: number): string {
  return `${clampYear(year)}-12-31`
}
export function resolveDate(date: string) {
  return { date, available: isValidDate(date) && date <= DATA_END }
}
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '1900-01-01' || date > '2026-12-31') return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}
export function activeAt(record: { start: string; end: string }, date: string): boolean {
  return record.start <= date && record.end >= date
}
export const names: Record<string, string> = {
  'United States of America': '美国',
  'United Kingdom': '英国',
  China: '中国',
  France: '法国',
  Japan: '日本',
  Canada: '加拿大',
  Australia: '澳大利亚',
  Brazil: '巴西',
  India: '印度',
  Argentina: '阿根廷',
  Mexico: '墨西哥',
  'Austria-Hungary': '奥匈帝国',
  Austria: '奥地利',
  Hungary: '匈牙利',
  'German Democratic Republic': '德意志民主共和国（东德）',
  'Italy/Sardinia': '意大利',
  Spain: '西班牙',
  Portugal: '葡萄牙',
  Netherlands: '荷兰',
  Belgium: '比利时',
  Switzerland: '瑞士',
  Sweden: '瑞典',
  Norway: '挪威',
  Finland: '芬兰',
  Denmark: '丹麦',
  Poland: '波兰',
  Ukraine: '乌克兰',
  'Belarus (Byelorussia)': '白俄罗斯',
  Estonia: '爱沙尼亚',
  Latvia: '拉脱维亚',
  Lithuania: '立陶宛',
  Georgia: '格鲁吉亚',
  Armenia: '亚美尼亚',
  Azerbaijan: '阿塞拜疆',
  Kazakhstan: '哈萨克斯坦',
  Uzbekistan: '乌兹别克斯坦',
  Turkmenistan: '土库曼斯坦',
  Tajikistan: '塔吉克斯坦',
  'Kyrgyz Republic': '吉尔吉斯斯坦',
  Moldova: '摩尔多瓦',
  Czechoslovakia: '捷克斯洛伐克',
  'Czech Republic': '捷克',
  Slovakia: '斯洛伐克',
  Yugoslavia: '南斯拉夫',
  Serbia: '塞尔维亚',
  Montenegro: '黑山',
  Croatia: '克罗地亚',
  Slovenia: '斯洛文尼亚',
  'Bosnia-Herzegovina': '波斯尼亚和黑塞哥维那',
  Bosnia: '波斯尼亚',
  Herzegovina: '黑塞哥维那',
  'Macedonia (FYROM/North Macedonia)': '北马其顿',
  Kosovo: '科索沃',
  Greece: '希腊',
  Bulgaria: '保加利亚',
  Rumania: '罗马尼亚',
  Albania: '阿尔巴尼亚',
  Ireland: '爱尔兰',
  Iceland: '冰岛',
  'Iran (Persia)': '伊朗（波斯）',
  Iraq: '伊拉克',
  Syria: '叙利亚',
  Lebanon: '黎巴嫩',
  Israel: '以色列',
  Palestine: '巴勒斯坦',
  'Saudi Arabia': '沙特阿拉伯',
  'United Arab Emirates': '阿拉伯联合酋长国',
  Qatar: '卡塔尔',
  Oman: '阿曼',
  Kuwait: '科威特',
  'Yemen (Arab Republic of Yemen)': '也门',
  "Yemen, People's Republic of": '南也门',
  Jordan: '约旦',
  Bahrain: '巴林',
  Pakistan: '巴基斯坦',
  Bangladesh: '孟加拉国',
  Afghanistan: '阿富汗',
  Nepal: '尼泊尔',
  Bhutan: '不丹',
  Mongolia: '蒙古',
  Korea: '朝鲜半岛',
  "Korea, People's Republic of": '朝鲜',
  'Korea, Republic of': '韩国',
  Taiwan: '台湾',
  Tibet: '西藏',
  Indonesia: '印度尼西亚',
  Malaysia: '马来西亚',
  Singapore: '新加坡',
  Thailand: '泰国',
  'Myanmar (Burma)': '缅甸',
  'Vietnam (Annam/Cochin China/Tonkin)': '越南',
  'Vietnam, Democratic Republic of': '越南（北越）',
  'Vietnam, Republic of': '南越',
  'Cambodia (Kampuchea)': '柬埔寨',
  Laos: '老挝',
  Philippines: '菲律宾',
  'Sri Lanka (Ceylon)': '斯里兰卡',
  'East Timor': '东帝汶',
  Egypt: '埃及',
  Libya: '利比亚',
  Tunisia: '突尼斯',
  Algeria: '阿尔及利亚',
  Morocco: '摩洛哥',
  Sudan: '苏丹',
  'South Sudan': '南苏丹',
  Ethiopia: '埃塞俄比亚',
  Eritrea: '厄立特里亚',
  Djibouti: '吉布提',
  Somalia: '索马里',
  Kenya: '肯尼亚',
  Uganda: '乌干达',
  'Tanzania (Tanganyika)': '坦桑尼亚',
  'South Africa': '南非',
  Namibia: '纳米比亚',
  Botswana: '博茨瓦纳',
  Angola: '安哥拉',
  Mozambique: '莫桑比克',
  Zambia: '赞比亚',
  'Zimbabwe (Rhodesia)': '津巴布韦',
  Malawi: '马拉维',
  'Madagascar (Malagasy)': '马达加斯加',
  'Congo, Democratic Republic of (Zaire)': '刚果民主共和国',
  Congo: '刚果共和国',
  Gabon: '加蓬',
  Cameroon: '喀麦隆',
  Nigeria: '尼日利亚',
  Niger: '尼日尔',
  Chad: '乍得',
  'Central African Republic': '中非共和国',
  Mali: '马里',
  Mauritania: '毛里塔尼亚',
  Senegal: '塞内加尔',
  Ghana: '加纳',
  "Cote D'Ivoire": '科特迪瓦',
  'Burkina Faso (Upper Volta)': '布基纳法索',
  Guinea: '几内亚',
  Liberia: '利比里亚',
  'Sierra Leone': '塞拉利昂',
  Benin: '贝宁',
  Togo: '多哥',
  Rwanda: '卢旺达',
  Burundi: '布隆迪',
  'Guinea-Bissau': '几内亚比绍',
  Chile: '智利',
  Peru: '秘鲁',
  Bolivia: '玻利维亚',
  Paraguay: '巴拉圭',
  Uruguay: '乌拉圭',
  Ecuador: '厄瓜多尔',
  Colombia: '哥伦比亚',
  Venezuela: '委内瑞拉',
  Guyana: '圭亚那',
  Surinam: '苏里南',
  Cuba: '古巴',
  Haiti: '海地',
  'Dominican Republic': '多米尼加共和国',
  Guatemala: '危地马拉',
  Honduras: '洪都拉斯',
  'El Salvador': '萨尔瓦多',
  Nicaragua: '尼加拉瓜',
  'Costa Rica': '哥斯达黎加',
  Panama: '巴拿马',
  'New Zealand': '新西兰',
  'Papua New Guinea': '巴布亚新几内亚',
  'French West Africa': '法属西非',
  'German Togoland': '德属多哥',
  'British Togoland': '英属多哥',
  Kamerun: '德属喀麦隆',
  'British Cameroons': '英属喀麦隆',
  'Italian Somaliland': '意属索马里',
  'British Somaliland (Somaliland Republic)': '英属索马里',
  'Spanish Sahara': '西属撒哈拉',
  'Spanish West Africa': '西属西非',
  'Spanish Morocco': '西属摩洛哥',
  'Cape Colony': '开普殖民地',
  Transvaal: '德兰士瓦',
  'Orange Free State': '奥兰治自由邦',
  Natal: '纳塔尔',
  'French Guyana': '法属圭亚那',
  Alaska: '阿拉斯加',
  Hawaii: '夏威夷',
  Danzig: '但泽',
  Zanzibar: '桑给巴尔',
}
export function displayName(name: string, date: string): string {
  if (name === 'Russia (Soviet Union)') {
    if (date < '1917-03-15') return '俄罗斯帝国'
    if (date < '1922-12-30') return '俄国（革命与内战时期）'
    return date < '1991-12-26' ? '苏联' : '俄罗斯'
  }
  if (name === 'Germany (Prussia)') {
    if (date < '1918-11-09') return '德意志帝国'
    if (date < '1919-08-11') return '德国（共和国过渡期）'
    return date < '1933-01-30' ? '德国（魏玛共和国）' : '德国（纳粹时期）'
  }
  if (name === 'German Federal Republic')
    return date < '1949-05-23'
      ? '德国西部占领区'
      : date < '1990-10-03'
        ? '德意志联邦共和国（西德）'
        : '德国'
  if (name === 'German Democratic Republic' && date < '1949-10-07') return '德国苏占区'
  if (name === 'Turkey (Ottoman Empire)') return date < '1922-11-01' ? '奥斯曼帝国' : '土耳其'
  if (name === 'China' && date < '1912-02-12') return '中国（清朝）'
  return names[name] ?? name
}
export function eraFor(year: number): { title: string; subtitle: string } {
  if (year < 1914) return { title: '帝国的世纪之交', subtitle: '旧秩序的版图，与新世纪的开端' }
  if (year < 1945)
    return { title: '世界大战与秩序重塑', subtitle: '帝国退场，新的国家走上历史舞台' }
  if (year < 1991) return { title: '冷战与独立浪潮', subtitle: '两极世界之下，殖民体系逐渐瓦解' }
  return { title: '走向多极的世界', subtitle: '国家的分合，仍在书写新的世界地图' }
}
