// design/Calendar.dc.html: พ.ย. 2569 (EVN), ธ.ค. 2569, ม.ค. 2570 — ชาร์ตตัวอย่าง
import { beforeAll, describe, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { calendarMonth } from '../src/engine/calendar.ts'
import { ASPECT_CODE } from '../src/lib/interp.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const A = () => computeChart(swe, { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 })
// ข้อมูลตัวอย่างในดีไซน์ไม่มีมุมกับกลางฟ้า (แม้หมายเหตุท้ายหน้าจะรวม) → เทียบเฉพาะที่ไม่ใช่ C
const noC = (e: { n: string }) => e.n !== 'C'
const key = (e: { day: number; t: string; type: string; n: string }) => `${e.day}${e.t}${ASPECT_CODE[e.type as '0']}${e.n}`

const NOV = [[1,'m','o','s'],[2,'m','q','U'],[3,'m','c','a'],[3,'m','t','A'],[4,'m','q','S'],[5,'S','q','S'],[6,'S','c','a'],[6,'S','t','A'],[7,'S','q','U'],[9,'S','o','s'],[11,'a','q','M'],[16,'S','o','M'],[21,'S','t','m'],[24,'m','q','S'],[25,'S','x','N'],[25,'m','c','a'],[25,'m','t','A'],[26,'S','q','V'],[26,'m','q','U'],[27,'m','o','s'],[30,'S','c','P']]
const DEC = [[2, "V", "q", "m"], [2, "m", "o", "M"], [5, "S", "t", "S"], [5, "m", "t", "m"], [6, "S", "q", "A"], [7, "S", "x", "U"], [8, "V", "q", "N"], [8, "a", "c", "V"], [8, "a", "t", "J"], [8, "m", "x", "N"], [9, "m", "q", "V"], [10, "V", "o", "J"], [10, "V", "x", "V"], [11, "m", "c", "P"], [14, "m", "t", "S"], [15, "m", "q", "A"], [16, "m", "x", "U"], [20, "V", "q", "S"], [20, "a", "q", "P"], [22, "V", "c", "a"], [22, "V", "t", "A"], [23, "V", "q", "U"], [25, "V", "o", "s"], [26, "S", "t", "J"], [26, "S", "t", "V"], [28, "m", "t", "J"], [28, "m", "t", "V"]]
const JAN = [[1, "V", "o", "M"], [3, "m", "x", "A"], [3, "m", "x", "a"], [4, "S", "x", "a"], [5, "S", "x", "A"], [5, "m", "t", "s"], [6, "V", "t", "m"], [7, "S", "t", "s"], [9, "m", "t", "M"], [10, "V", "x", "N"], [11, "V", "q", "V"], [12, "m", "o", "m"], [14, "S", "t", "M"], [14, "V", "c", "P"], [15, "m", "c", "N"], [16, "m", "q", "J"], [18, "m", "x", "P"], [19, "S", "o", "m"], [19, "V", "t", "S"], [20, "V", "q", "A"], [21, "V", "x", "U"], [21, "m", "o", "S"], [21, "m", "q", "a"], [22, "m", "c", "U"], [23, "S", "c", "N"], [23, "m", "q", "s"], [24, "S", "q", "J"], [27, "m", "q", "M"], [28, "S", "x", "P"], [30, "a", "q", "P"],
  // ดีไซน์ปฏิทินขาด พฤหัส□จันทร์ 28 ม.ค. 2570 — แต่ Timeline.dc.html มี JqM รอบแรก 2027-01-28 ตรงกัน
  [28, "J", "q", "M"]]
const exp = (L: (string | number)[][]) => L.map(([d, t, a, n]) => `${d}${t}${a}${n}`).sort()

describe('calendar', () => {
  it('พ.ย. 2569', () => {
    const m = calendarMonth(swe, A(), 2026, 11, true)
    expect(m.events.filter(noC).map(key).sort()).toEqual(exp(NOV))
    expect(m.moon).toEqual({ 2: 'lq', 9: 'new', 17: 'fq', 24: 'full' })
  })
  it('ธ.ค. 2569', () => {
    const m = calendarMonth(swe, A(), 2026, 12, true)
    expect(m.events.filter(noC).map(key).sort()).toEqual(exp(DEC))
    expect(m.moon).toEqual({ 1: 'lq', 9: 'new', 17: 'fq', 24: 'full', 31: 'lq' })
  })
  it('ม.ค. 2570', () => {
    const m = calendarMonth(swe, A(), 2027, 1, true)
    expect(m.events.filter(noC).map(key).sort()).toEqual(exp(JAN))
    expect(m.moon).toEqual({ 8: 'new', 16: 'fq', 22: 'full', 29: 'lq' })
  })
  it('พุธถอยหลังถึง 13 พ.ย. 2569 · ศุกร์เดินหน้า 14 พ.ย.', () => {
    const m = calendarMonth(swe, A(), 2026, 11, true)
    expect(m.stations.map((s) => `${s.day}${s.p}${s.dir}`)).toEqual(['13mD', '14VD'])
    // แถบถอยหลัง: 1–13 เต็ม · 14 ครึ่ง (ตามดีไซน์)
    expect([m.rx[1], m.rx[13], m.rx[14], m.rx[15]]).toEqual(['full', 'full', 'part', undefined])
  })
})
