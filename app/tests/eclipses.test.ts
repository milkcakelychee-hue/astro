// design/Eclipses.dc.html: อุปราคา 2569–2571 ของชาร์ตตัวอย่าง (ชนิด เวลา องศา เรือน การแตะดาว การมองเห็น)
import { beforeAll, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { eclipses } from '../src/engine/eclipses.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const INP = { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 }
const K: Record<string, string> = { total: 'เต็มดวง', annular: 'วงแหวน', partial: 'บางส่วน', penumbral: 'เงามัว', hybrid: 'ผสม' }
const SG = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน']
const E = [
  ['sun', 'สุริยุปราคาเต็มดวง', '2026-8-13 0:45', 'สิงห์ 20°06′', 6, ''],
  ['moon', 'บางส่วน', '2026-8-28 11:12', 'มีน 4°50′', 12, 'V8'],
  ['sun', 'วงแหวน', '2027-2-6 22:59', 'กุมภ์ 17°39′', 12, 'U0,S8'], ['moon', 'เงามัว', '2027-2-21 6:12', 'กันย์ 1°58′', 6, 'V0'],
  ['moon', 'เงามัว', '2027-7-18 23:02', 'มังกร 25°57′', 11, 'm8'], ['sun', 'เต็มดวง', '2027-8-2 17:06', 'สิงห์ 9°55′', 5, 'S0,U8'],
  ['moon', 'เงามัว', '2027-8-17 14:13', 'กุมภ์ 24°04′', 12, ''], ['moon', 'บางส่วน', '2028-1-12 11:12', 'กรกฎ 21°33′', 5, ''],
  ['sun', 'วงแหวน', '2028-1-26 22:07', 'กุมภ์ 6°08′', 11, 'N0'], ['moon', 'บางส่วน', '2028-7-7 1:19', 'มังกร 15°15′', 11, ''],
  ['sun', 'เต็มดวง', '2028-7-22 9:55', 'กรกฎ 29°46′', 5, 'm0,N8'], ['moon', 'เต็มดวง', '2028-12-31 23:51', 'กรกฎ 10°34′', 4, ''],
]
it('ตรงกับดีไซน์', () => {
  const nat = computeChart(swe, INP)
  const ecl = eclipses(swe, nat, true, swe.julday(2026, 8, 1, 0), swe.julday(2029, 1, 1, 0))
  // เวลา/องศาต่างได้ ≤1 นาที/ลิปดา (จันทรุปราคาช้ากว่าเว็บ ~10 วินาที — docs/09)
  const toMin = (s: string) => { const [d, t] = s.split(' '); const [h, m] = t!.split(':').map(Number); return Date.parse(d!.replace(/-(\d)(?!\d)/g, '-0$1')) / 6e4 + h! * 60 + m! }
  const deg = (s: string) => { const m = /(\S+) (\d+)°(\d+)′/.exec(s)!; return SG.indexOf(m[1]!) * 1800 + +m[2]! * 60 + +m[3]! }
  const got = ecl.map((e) => {
    const p = thaiParts(dateOfJd(e.jd)), m = Math.floor((e.lon % 30) * 60)
    return [e.sun ? 'sun' : 'moon', K[e.kind], `${p.y}-${p.mo}-${p.d} ${p.hh}:${String(p.mi).padStart(2, '0')}`, `${SG[Math.floor(e.lon / 30)]} ${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′`, e.house, e.hits.map((h) => h.p + h.type).join(',')]
  })
  expect(got.length).toBe(E.length)
  got.forEach((g, i) => {
    expect(Math.abs(toMin(g[2] as string) - toMin(E[i]![2] as string))).toBeLessThanOrEqual(1)
    expect(Math.abs(deg(g[3] as string) - deg(E[i]![3] as string))).toBeLessThanOrEqual(2)
    expect(g[4]).toBe(E[i]![4])
  })
  expect(got.map((g) => g[5])).toEqual(E.map((e) => e[5]))
  // เห็นในไทย (ดีไซน์ 2570–2571)
  expect(ecl.slice(2).map((e) => e.vis)).toEqual(['no', 'low', 'yes', 'no', 'no', 'no', 'no', 'yes', 'no', 'yes'])
}, 120000)
