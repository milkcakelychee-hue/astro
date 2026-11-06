// design/Growth.dc.html + docs/08: จันทร์โปรเกรสเข้าเมถุน 4 เม.ย. 2570 / กรกฎ 15 พ.ค. 2572 · Solar Arc 26°13′ (4 พ.ย. 2569)
import { beforeAll, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { pdAspect, primaryDirections, progEvents, saEvents, solarArc } from '../src/engine/growth.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'
import { writeFileSync } from 'fs'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const INP = { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 }
const ymd = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.y}-${p.mo}-${p.d}` }
const ym = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.y}-${p.mo}` }

it('ตรงกับดีไซน์/astro-seek', () => {
  const nat = computeChart(swe, INP)
  const now = swe.julday(2026, 11, 4, 5)
  const arc = solarArc(swe, nat, now)
  expect(`${Math.floor(arc)}°${Math.floor((arc % 1) * 60)}′`).toBe('26°13′')
  const pe = progEvents(swe, nat, now, now + 5 * 365.25, true)
  const ing = pe.filter((e) => e.kind === 'ingress' && e.a === 'M').map((e) => [e.sign, ymd(e.jd)])
  expect(ing).toContainEqual([2, '2027-4-4'])
  expect(ing).toContainEqual([3, '2029-5-15'])
  const sa = saEvents(swe, nat, now - 60, now + 5 * 365.25, true)
  const pd = primaryDirections(swe, nat, INP.lat, INP.lon, 40).filter((d) => d.age > 26 && d.age < 36)
  writeFileSync('/tmp/growth.txt', [
    'PROG', ...pe.map((e) => `${ym(e.jd)} ${e.a} ${e.kind} ${e.type ?? ''} ${e.b ?? e.sign}`),
    'SA', ...sa.map((e) => `${ym(e.jd)} ${e.a} ${e.type} ${e.b}`),
    'PD', ...pd.map((d) => { const x = pdAspect(d); return `${d.age.toFixed(2)} ${d.p} ${x.type} ${x.to} ${d.angle} ${d.dir}` }),
  ].join('\n'))
}, 120000)
