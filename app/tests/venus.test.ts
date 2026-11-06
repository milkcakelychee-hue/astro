// design/VenusRose.dc.html: กุมด้านใน/ด้านนอก 2569–2577 (วันที่ไทย + ราศี)
import { beforeAll, expect, it } from 'vitest'
import { venusConj } from '../src/engine/venus.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const SG = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน']
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const R = [['24 ต.ค. 2569', 'พิจิก 0°', '12 ส.ค. 2570', 'สิงห์ 19°'], ['1 มิ.ย. 2571', 'เมถุน 11°', '24 มี.ค. 2572', 'เมษ 3°'], ['6 ม.ค. 2573', 'มังกร 16°', '20 ต.ค. 2573', 'ตุลย์ 27°'], ['11 ส.ค. 2574', 'สิงห์ 18°', '2 มิ.ย. 2575', 'เมถุน 12°'], ['20 มี.ค. 2576', 'เมษ 0°', '4 ม.ค. 2577', 'มังกร 13°']]
it('ตรงกับดีไซน์', () => {
  const c = venusConj(swe, swe.julday(2026, 10, 1, 0), swe.julday(2034, 2, 1, 0))
  const f = (x: { jd: number; lon: number }) => { const p = thaiParts(dateOfJd(x.jd)); return [`${p.d} ${MS[p.mo - 1]} ${p.y + 543}`, `${SG[Math.floor(x.lon / 30)]} ${Math.floor(x.lon % 30)}°`] }
  const inf = c.filter((x) => x.inferior), sup = c.filter((x) => !x.inferior)
  expect(inf.slice(0, 5).map((x, i) => [...f(x), ...f(sup[i]!)])).toEqual(R)
}, 120000)
