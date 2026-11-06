// design/Cycles.dc.html (4 พ.ย. 2569) + เทียบ astro-seek 6 พ.ย. 2569 (Planet Returns, Returns on Particular Degree)
// ดีไซน์คลาด 1 วัน (อังคาร 23 ก.ย., พลูโต 30 เม.ย.) และใช้ True Node — ค่าที่นี่คือค่าที่ตรง astro-seek (Mean Node)
import { beforeAll, expect, it } from 'vitest'
import { computeChart, type Pt } from '../src/engine/chart.ts'
import { cycleAngle, nextCycleEvent } from '../src/engine/cycles.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const INP = { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 }
const D: [Pt, number, string, string][] = [['a', 276.5, 'return', '2027-9-22'], ['J', 110.3, 'opp', '2029-10-15'], ['s', 322.4, 'return', '2029-5-21'], ['n', 167, 'opp', '2027-7-7'], ['c', 150.3, 'opp', '2033-6-9'], ['U', 109.7, 'opp', '2042-9-5'], ['N', 59.3, 'sq1', '2039-6-8'], ['P', 55.4, 'sq1', '2048-4-29']]
it('ตรงกับดีไซน์', () => {
  const nat = computeChart(swe, INP)
  const now = swe.julday(2026, 11, 4, 5)
  const got = D.map(([p]) => { const e = nextCycleEvent(swe, nat, p, now, 30)!; const t = thaiParts(dateOfJd(e.jd)); return [p, +cycleAngle(swe, nat, p, now).toFixed(1), e.kind, `${t.y}-${t.mo}-${t.d}`] })
  got.forEach((g, i) => { expect(Math.abs((g[1] as number) - D[i]![1])).toBeLessThan(1.5); expect(g.slice(2)).toEqual(D[i]!.slice(2)) })
}, 120000)
