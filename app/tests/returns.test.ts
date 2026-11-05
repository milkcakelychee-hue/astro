// design/SolarReturn.dc.html: ปี 2569 และ 2570 ชาร์ตตัวอย่าง (เพชรบุรี)
import { beforeAll, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { chartAtJd, solarReturnJd, srAspects } from '../src/engine/returns.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { ASPECT_CODE } from '../src/lib/interp.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const INP = { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 }
const SIGN = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน']
const Y = [
  { y: 2026, t: '9:01', asc: 'กันย์ 23', pl: { S: 11, M: 8, m: 10, V: 1, a: 10, J: 11, s: 7, U: 9, N: 7, P: 5 }, cusp0: 'กันย์',
    asp: [['N', 'x', 'P', 7], ['m', 'x', 'A', 19], ['U', 'x', 'N', 56], ['U', 't', 'P', 64], ['a', 'c', 'C', 88], ['a', 'q', 'A', 115], ['S', 't', 's', 119], ['V', 'q', 'a', 146], ['J', 'x', 'U', 164]] },
  { y: 2027, t: '14:45', asc: 'ธนู 15', pl: { S: 8, M: 10, m: 8, V: 8, a: 10, J: 9, s: 5, U: 6, N: 4, P: 2 }, cusp0: 'ธนู',
    asp: [['m', 'o', 'P', 5], ['S', 'x', 'a', 14], ['m', 't', 'N', 35], ['N', 'x', 'P', 41], ['V', 'x', 'U', 95], ['V', 'x', 'a', 97], ['S', 'c', 'V', 111], ['U', 'x', 'N', 167], ['S', 't', 'A', 169]] },
]
it('ตรงกับดีไซน์', () => {
  const nat = computeChart(swe, INP)
  for (const e of Y) {
    const jd = solarReturnJd(swe, nat, INP, e.y)
    const p = thaiParts(dateOfJd(jd))
    expect([p.y, p.mo, p.d, `${p.hh}:${String(p.mi).padStart(2, '0')}`]).toEqual([e.y, 8, 5, e.t])
    const c = chartAtJd(swe, INP, jd)
    expect(`${SIGN[Math.floor(c.pos.A.lon / 30)]} ${Math.floor(c.pos.A.lon % 30)}`).toBe(e.asc)
    expect(Object.fromEntries(Object.keys(e.pl).map((k) => [k, c.house(c.pos[k as 'S'].lon)]))).toEqual(e.pl)
    const got = srAspects(c).map((a) => [a.a, ASPECT_CODE[a.type], a.b, Math.floor(a.orb * 60)])
    expect(got.map((g) => g.slice(0, 3))).toEqual(e.asp.map((g) => g.slice(0, 3)))
    got.forEach((g, i) => expect(Math.abs((g[3] as number) - (e.asp[i][3] as number))).toBeLessThanOrEqual(1))
  }
}, 60000)
