// design/LunarReturn.dc.html: รอบ 27 ต.ค. / 24 พ.ย. / 21 ธ.ค. 2569 / 18 ม.ค. 2570 (เพชรบุรี)
import { beforeAll, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { chartAtJd, lunarReturnJds } from '../src/engine/returns.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const INP = { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 }
const SIGN = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน']
const R = [
  { t: '2026-10-27 21:54', asc: 'กรกฎ 4', pl: { S: 5, M: 11, m: 5, V: 4, a: 2, J: 2, s: 10, U: 12, N: 10, P: 8 } },
  { t: '2026-11-24 8:13', asc: 'ธนู 25', pl: { S: 12, M: 5, m: 11, V: 10, a: 9, J: 8, s: 4, U: 6, N: 4, P: 2 } },
  { t: '2026-12-21 19:23', asc: 'กรกฎ 19', pl: { S: 6, M: 11, m: 6, V: 4, a: 2, J: 2, s: 9, U: 11, N: 9, P: 7 } },
  { t: '2027-1-18 5:07' },
]
it('ตรงกับดีไซน์', () => {
  const nat = computeChart(swe, INP)
  const now = swe.julday(2026, 11, 2, 5)
  const js = lunarReturnJds(swe, nat, now, 4)
  js.forEach((jd, i) => {
    const p = thaiParts(dateOfJd(jd))
    const e = R[i]!
    // นาทีต่างได้ ±1 (ดู docs/09) — ตรวจวันที่ตรง และเวลาห่างไม่เกิน 1 นาที
    const [dt, hm] = e.t.split(' ')
    const [ey, emo, ed] = dt!.split('-').map(Number)
    const [eh, em] = hm!.split(':').map(Number)
    expect([p.y, p.mo, p.d]).toEqual([ey, emo, ed])
    expect(Math.abs(p.hh * 60 + p.mi + p.s / 60 - (eh! * 60 + em!))).toBeLessThan(1)
    if (!e.pl) return
    const c = chartAtJd(swe, INP, jd)
    expect(`${SIGN[Math.floor(c.pos.A.lon / 30)]} ${Math.floor(c.pos.A.lon % 30)}`).toBe(e.asc)
    expect(Object.fromEntries(Object.keys(e.pl).map((k) => [k, c.house(c.pos[k as 'S'].lon)]))).toEqual(e.pl)
  })
}, 60000)
