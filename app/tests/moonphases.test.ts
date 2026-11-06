// design/MoonPhases.dc.html: จันทร์ว่าง พ.ย. 2569 (14 ช่วง) — เวลาไทย ±1 นาที
import { beforeAll, expect, it } from 'vitest'
import { moonMonth } from '../src/engine/moonphases.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const VOC = [['1', '04:59', '1', '11:18', 'V', 'q'], ['3', '07:10', '3', '15:28', 'V', 'x'], ['4', '13:57', '5', '21:38', 'm', 'x'], ['7', '20:19', '8', '05:40', 'J', 'x'], ['10', '06:25', '10', '15:36', 'J', 'q'], ['12', '18:29', '13', '03:27', 'J', 't'], ['15', '01:55', '15', '16:24', 'V', 'q'], ['17', '21:25', '18', '04:19', 'a', 'o'], ['20', '08:46', '20', '12:52', 'S', 't'], ['22', '14:38', '22', '17:10', 'a', 't'], ['24', '17:09', '24', '18:10', 'a', 'q'], ['26', '12:23', '26', '17:51', 'J', 'x'], ['28', '12:40', '28', '18:21', 'V', 'q'], ['30', '17:10', '30', '21:13', 'V', 'x']]
const CODE: Record<string, string> = { '0': 'c', '6': 'x', '4': 'q', '3': 't', '8': 'o' }
const min = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return p.d * 1440 + p.hh * 60 + p.mi }
it('ตรงกับดีไซน์', () => {
  const m = moonMonth(swe, 2026, 11)
  expect(m.vocs.length).toBe(VOC.length)
  m.vocs.forEach((v, i) => {
    const e = VOC[i]!
    const em = (d: string, t: string) => +d * 1440 + +t.slice(0, 2) * 60 + +t.slice(3)
    expect(Math.abs(min(v.start) - em(e[0]!, e[1]!))).toBeLessThanOrEqual(1)
    expect(Math.abs(min(v.end) - em(e[2]!, e[3]!))).toBeLessThanOrEqual(1)
    expect([v.p, CODE[v.type]]).toEqual([e[4], e[5]])
  })
}, 120000)
