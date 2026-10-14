import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { geoArea } from 'd3-geo'
const raw = readFileSync(new URL('../data/cshapes-original.geojson', import.meta.url))
const source = JSON.parse(raw)
const date = (p, prefix) =>
  [
    p[prefix + 'year'],
    String(p[prefix + 'month']).padStart(2, '0'),
    String(p[prefix + 'day']).padStart(2, '0'),
  ].join('-')
const features = source.features.flatMap((f, index) => {
  const p = f.properties
  if (p.gweyear < 1900) return []
  const geometry = f.geometry
  const geometryId = createHash('sha256')
    .update(JSON.stringify(geometry))
    .digest('hex')
    .slice(0, 16)
  // Preserve all original coordinates. D3 requires clockwise spherical exterior rings.
  if (geoArea(geometry) > 2 * Math.PI) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
    for (const polygon of polygons) for (const ring of polygon) ring.reverse()
  }
  return [
    {
      type: 'Feature',
      id: `${p.gwcode}:${date(p, 'gws')}`,
      geometry,
      properties: {
        name: p.cntry_name,
        code: p.gwcode,
        start: date(p, 'gws'),
        end: date(p, 'gwe'),
        area: p.area,
        capital: p.capname,
        capitalPoint: [p.caplong, p.caplat],
        geometryId,
        sourceRecord: index + 1,
      },
    },
  ]
})
const result = { type: 'FeatureCollection', features }
writeFileSync(new URL('../public/data/borders.geojson', import.meta.url), JSON.stringify(result))
const provenance = {
  source: 'CShapes 2.0, ETH Zurich',
  url: 'https://icr.ethz.ch/data/cshapes/CShapes-2.0.geojson',
  retrieved: '2026-10-14',
  sha256: createHash('sha256').update(raw).digest('hex'),
  license: 'CC BY-NC-SA 4.0',
  sourceFeatures: source.features.length,
  features: features.length,
  coverageStart: '1900-01-01',
  coverageEnd: '2019-12-31',
  reviewStatus: 'source-imported-not-independently-verified',
  modifications:
    'Filter records ending before 1900; retain explicit GW calendar date fields; preserve all source coordinate precision; reverse rings as needed for D3 spherical winding. Preserve original 1-based source feature index and hash of original geometry. No inferred borders or dates.',
  knownLimitations: [
    '2018 codebook p.3: some dates use first day of month/year as placeholders; individual date precision is not provided in GeoJSON.',
    '2018 codebook p.4: excludes territorial changes below 10000 sq km and many temporary wartime changes.',
    '2018 codebook p.4: some modern borders backdated when evidence unavailable; some conflicting maps resolved by preference for current borders.',
    'GeoJSON lacks status, ruledby and b_def columns described in codebook. Dependency status cannot be safely inferred from feature name.',
    '2020-2026 are outside available coverage and must remain empty.',
    'A new record may mean capital or attribute change, not geometry change.',
  ],
}
writeFileSync(
  new URL('../public/data/provenance.json', import.meta.url),
  JSON.stringify(provenance, null, 2),
)
const records = features.map((f) => ({
  id: f.id,
  ...f.properties,
  reviewStatus: 'unreviewed',
  sourceId: 'cshapes-2-gw',
  datePrecision: 'unspecified-by-source',
  legalStatus: 'not-provided',
  evidence: [],
}))
const temporalIssues = []
for (const code of new Set(records.map((r) => r.code))) {
  const periods = records
    .filter((r) => r.code === code)
    .sort((a, b) => a.start.localeCompare(b.start))
  for (let i = 1; i < periods.length; i++) {
    const prior = periods[i - 1],
      next = periods[i]
    if (next.start <= prior.end)
      temporalIssues.push({ code, type: 'overlap', previous: prior.id, next: next.id })
    else {
      const gap = (Date.parse(next.start) - Date.parse(prior.end)) / 86400000 - 1
      if (gap > 0)
        temporalIssues.push({
          code,
          type: 'gap-requires-context',
          days: gap,
          previous: prior.id,
          next: next.id,
        })
    }
  }
}
writeFileSync(
  new URL('../public/data/research-register.json', import.meta.url),
  JSON.stringify(
    {
      generated: '2026-10-14',
      reviewStatus: 'not-a-completed-historical-audit',
      records,
      sourceReferences: [
        { id: 'cshapes-2-gw', url: provenance.url, sha256: provenance.sha256 },
        {
          id: 'cshapes-codebook-2018',
          url: 'https://icr.ethz.ch/data/cshapes/CShapes-2.0_Codebook.pdf',
          relevantPages: [3, 4, 5],
        },
        {
          id: 'cshapes-changelog',
          url: 'https://icr.ethz.ch/data/cshapes/ChangeLog.txt',
          note: '2.0 entry dated 2020-06-07 states coverage through 2019-12-31',
        },
      ],
      temporalIssues,
      years: Array.from({ length: 127 }, (_, i) => {
        const year = 1900 + i,
          day = `${year}-12-31`
        return {
          year,
          status: year > 2019 ? 'missing' : 'source-imported-unreviewed',
          recordsAtYearEnd: records.filter((r) => r.start <= day && r.end >= day).length,
          independentlyVerifiedRecords: 0,
        }
      }),
    },
    null,
    2,
  ),
)
console.log(
  `${features.length} original-precision boundary records; ${(JSON.stringify(result).length / 1024 / 1024).toFixed(1)} MB; ${temporalIssues.length} temporal intervals for contextual review`,
)
