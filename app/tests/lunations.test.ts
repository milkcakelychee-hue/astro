// design/Lunations.dc.html: พ.ย. 2569 – ก.ค. 2570 ชาร์ตตัวอย่าง
import { beforeAll, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { lunations } from '../src/engine/lunations.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { ASPECT_CODE } from '../src/lib/interp.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const L: [string, string, string, number, number, string[], string][] = [
  ['n', '2026-11-09', '14:02', 7, 16 * 60 + 53, ['os0.2', 'qU2.0', 'tA2.7'], ''], ['f', '2026-11-24', '21:53', 2, 2 * 60 + 20, ['qV2.0', 'tN0.4'], ''],
  ['n', '2026-12-09', '07:51', 8, 16 * 60 + 56, ['qA2.8', 'cC1.0'], ''], ['f', '2026-12-24', '08:28', 3, 2 * 60 + 13, [], ''],
  ['n', '2027-01-08', '03:24', 9, 17 * 60 + 18, ['ts0.6'], ''], ['f', '2027-01-22', '19:17', 4, 2 * 60 + 14, ['qJ2.1', 'oN0.5'], ''],
  ['n', '2027-02-06', '22:56', 10, 17 * 60 + 37, ['qs1.0', 'cU2.7'], 'sol_annular'], ['f', '2027-02-21', '06:23', 5, 2 * 60 + 5, ['cV2.2', 'tJ2.3'], 'lun_penumbral'],
  ['n', '2027-03-08', '16:29', 11, 17 * 60 + 34, ['qC0.3'], ''], ['f', '2027-03-22', '17:43', 6, 1 * 60 + 35, ['tN1.1'], ''],
  ['n', '2027-04-07', '06:51', 0, 16 * 60 + 57, ['tC1.0'], ''], ['f', '2027-04-21', '05:27', 7, 36, ['qm2.0', 'qN2.1'], ''],
  ['n', '2027-05-06', '17:58', 1, 15 * 60 + 42, ['oa2.0', 'cs0.9', 'qU0.8'], ''], ['f', '2027-05-20', '17:59', 7, 29 * 60 + 13, ['tm0.6'], ''],
  ['n', '2027-06-05', '02:40', 2, 13 * 60 + 58, ['tU0.9', 'qA0.2'], ''], ['f', '2027-06-19', '07:44', 8, 27 * 60 + 33, [], ''],
  ['n', '2027-07-04', '10:02', 3, 11 * 60 + 57, ['ta1.7', 'tA2.2'], ''], ['f', '2027-07-18', '22:44', 9, 25 * 60 + 48, ['tM2.0', 'om2.8'], 'lun_penumbral'],
]
const H = [8, 3, 9, 4, 11, 5, 12, 6, 1, 7, 1, 8, 2, 9, 3, 10, 4, 11]
it('ตรงกับดีไซน์', () => {
  const nat = computeChart(swe, { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 })
  const got = lunations(swe, nat, swe.julday(2026, 11, 1, -7), swe.julday(2027, 8, 1, -7), true)
  expect(got.length).toBe(18)
  got.forEach((g, i) => {
    const [k, d, t, sign, mins, asp, ecl] = L[i]
    const p = thaiParts(dateOfJd(g.jd))
    const when = `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')} ${String(p.hh).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`
    const m = Math.round((g.lon % 30) * 60)
    expect([d, g.full ? 'f' : 'n', when, Math.floor(g.lon / 30), g.house]).toEqual([d, k, `${d} ${t}`, sign, H[i]])
    expect(Math.abs(m - mins), d).toBeLessThanOrEqual(1)
    expect([d, g.aspects.map((a) => ASPECT_CODE[a.type] + a.n + a.orb.toFixed(1)).sort()]).toEqual([d, [...asp].sort()])
    expect([d, g.eclipse ?? '']).toEqual([d, ecl])
  })
}, 60000)
