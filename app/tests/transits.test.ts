// design/Transit.dc.html: ทรานซิต 1 พ.ย. 2569 12:00 — มุม orb เข้าใกล้/ห่างออก และวันที่ตรงพอดี
import { beforeAll, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { transitRows } from '../src/engine/transits.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { ASPECT_CODE } from '../src/lib/interp.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
// [คีย์, orb ลิปดา (ดีไซน์ปัดเศษ), A/S, วันที่ตรงพอดี] — mos/PcN ดีไซน์ไม่ใส่วันที่ (ตรวจแยก)
const L: [string, number, string, string[] | null][] = [
  ['UqV', 22, 'a', ['2026-07-14', '2026-11-11', '2027-05-02']], ['JqM', 33, 's', ['2026-10-28', '2027-01-28', '2027-06-23']], ['PcN', 26, 's', null],
  ['NxN', 37, 's', ['2026-04-15', '2026-10-07', '2027-02-15']], ['PqJ', 74, 'a', ['2026-02-23', '2026-07-24', '2027-01-02']], ['stP', 89, 'a', ['2026-04-20']],
  ['UtN', 118, 'a', ['2026-06-12', '2026-12-20', '2027-03-30']], ['mos', 14, 's', null], ['mqU', 91, 'a', ['2026-10-14', '2026-11-03', '2026-11-26']],
  ['atC', 49, 's', ['2026-10-31']], ['Mcm', 109, 's', []], ['MoN', 137, 'a', []],
]
const fd = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` }

it('ตรงกับดีไซน์', () => {
  const nat = computeChart(swe, { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 })
  const rows = transitRows(swe, nat, swe.julday(2026, 11, 1, 5), true)
  const got = rows.map((r) => r.t + ASPECT_CODE[r.type] + r.n)
  expect(got.sort()).toEqual(L.map((l) => l[0]).sort())
  for (const [k, om, as, ex] of L) {
    const r = rows.find((x) => x.t + ASPECT_CODE[x.type] + x.n === k)!
    expect(Math.abs(r.orb * 60 - om), k).toBeLessThanOrEqual(1)
    expect([k, r.applying ? 'a' : 's']).toEqual([k, as])
    // ข้อมูลตัวอย่างหน้านี้สุ่มรายวัน: บางวันเลื่อนไป +1 (เช่น 13 ก.ค. 21:47 → 14) — หน้า Timeline/Calendar ตรงกับ bisection (docs/01)
    if (ex) { expect(r.passes.length, k).toBe(ex.length); r.passes.forEach((j, i) => expect([fd(j), fd(j + 1)], k).toContain(ex[i])) }
  }
}, 60000)
