// ปฏิทินดวงส่วนตัว (design/Calendar.dc.html): วันที่ดาวจรทำมุมพอดีกับชาร์ตเกิด + ข้างขึ้นแรม + พุธ/ศุกร์ถอยหลัง
// ดาวบนฟ้า: อาทิตย์ พุธ ศุกร์ อังคาร พฤหัสบดี เสาร์ × ดาวเกิด 10 ดวง ลัคนา กลางฟ้า · วันที่ = เวลาไทย
import type { AspectType } from './aspects.ts'
import { mod, type Chart, type Pt } from './chart.ts'
import { bodyAt, dateOfJd, thaiParts } from './sky.ts'
import type { Swe } from './swe.ts'

export const CAL_TRANSIT: Pt[] = ['S', 'm', 'V', 'a', 'J', 's']
export const CAL_NATAL: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'A', 'C']
/** มุมทั้งสองฝั่ง (เช่น 60 กับ 300) */
const SIDES: [number, AspectType][] = [[0, '0'], [60, '6'], [300, '6'], [90, '4'], [270, '4'], [120, '3'], [240, '3'], [180, '8']]

export interface CalEvent { day: number; jd: number; t: Pt; type: AspectType; n: Pt }
export type MoonQ = 'new' | 'fq' | 'full' | 'lq'
export interface CalMonth {
  events: CalEvent[]
  /** วันที่ → ข้างขึ้นแรมหลัก */
  moon: Record<number, MoonQ>
  /** วันที่ → 'full' ถอยหลังทั้งวัน | 'part' วันที่หยุด */
  rx: Record<number, 'full' | 'part'>
  /** วันที่ดาวพุธ/ศุกร์หยุด: dir = 'R' เริ่มถอยหลัง | 'D' เดินหน้า */
  stations: { day: number; p: Pt; dir: 'R' | 'D' }[]
  /** พุธ/ศุกร์ ถอยหลังอยู่ตอนสิ้นสุดช่วง → วันที่เดินหน้า (อาจเลยเดือน) */
  rxUntil: { p: Pt; jd: number }[]
}

const signed = (x: number) => mod(x + 180, 360) - 180
function bisect(f: (jd: number) => number, a: number, b: number): number {
  let fa = f(a)
  for (let i = 0; i < 50 && b - a > 1e-6; i++) {
    const m = (a + b) / 2
    const fm = f(m)
    if (fa <= 0 === fm <= 0) { a = m; fa = fm } else b = m
  }
  return (a + b) / 2
}
/** JD ของเที่ยงคืนเวลาไทยต้นวัน */
const jd0Thai = (swe: Swe, y: number, mo: number, d: number) => swe.julday(y, mo, d, -7)
const dayOf = (jd: number) => thaiParts(dateOfJd(jd)).d

/** จุดตัด f = 0 ใน [a,b] แบบสุ่มทุก step วัน */
function crossings(f: (jd: number) => number, a: number, b: number, step: number): number[] {
  const out: number[] = []
  let x = a
  let fx = f(x)
  while (x < b) {
    const y = Math.min(x + step, b)
    const fy = f(y)
    if (fx <= 0 !== fy <= 0 && Math.abs(fx - fy) < 90) out.push(bisect(f, x, y))
    x = y
    fx = fy
  }
  return out
}

export function calendarMonth(swe: Swe, natal: Chart, y: number, mo: number, withAngles: boolean): CalMonth {
  const days = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  const a = jd0Thai(swe, y, mo, 1)
  const b = a + days
  const events: CalEvent[] = []
  const natPts = withAngles ? CAL_NATAL : CAL_NATAL.filter((p) => p !== 'A' && p !== 'C')
  // ตำแหน่งดาวจรต่อชั่วโมงไม่ต้องคำนวณซ้ำ: แคชตามดาว
  for (const t of CAL_TRANSIT) {
    const cache = new Map<number, number>()
    const lon = (jd: number) => {
      let v = cache.get(jd)
      if (v === undefined) { v = bodyAt(swe, jd, t).lon; cache.set(jd, v) }
      return v
    }
    for (const n of natPts) {
      const nl = natal.pos[n].lon
      for (const [ang, type] of SIDES) {
        for (const jd of crossings((x) => signed(lon(x) - nl - ang), a, b, 0.5)) events.push({ day: dayOf(jd), jd, t, type, n })
      }
    }
  }
  events.sort((p, q) => p.jd - q.jd)

  const moon: Record<number, MoonQ> = {}
  const el = (jd: number) => mod(bodyAt(swe, jd, 'M').lon - bodyAt(swe, jd, 'S').lon, 360)
  for (const [c, k] of [[0, 'new'], [90, 'fq'], [180, 'full'], [270, 'lq']] as const) {
    for (const jd of crossings((x) => signed(el(x) - c), a, b, 0.25)) moon[dayOf(jd)] = k
  }

  const rx: Record<number, 'full' | 'part'> = {}
  const stations: CalMonth['stations'] = []
  const rxUntil: CalMonth['rxUntil'] = []
  for (const p of ['m', 'V'] as Pt[]) {
    const sp = (jd: number) => bodyAt(swe, jd, p).speed
    const st = crossings(sp, a - 1, b, 0.5).filter((jd) => jd >= a)
    for (const jd of st) stations.push({ day: dayOf(jd), p, dir: sp(jd + 0.5) < 0 ? 'R' : 'D' })
    for (let d = 1; d <= days; d++) {
      const s = jd0Thai(swe, y, mo, d)
      const r0 = sp(s) < 0, r1 = sp(s + 1) < 0
      // ดาวใดถอยหลังทั้งวัน = full มาก่อน part
      if (r0 && r1) rx[d] = 'full'
      else if ((r0 || r1) && !rx[d]) rx[d] = 'part'
    }
    if (sp(b) < 0) {
      // หาวันเดินหน้า ภายใน 60 วัน
      const end = crossings(sp, b, b + 60, 0.5)[0]
      if (end) rxUntil.push({ p, jd: end })
    } else {
      const last = st.filter((jd) => sp(jd + 0.5) > 0).pop()
      if (last) rxUntil.push({ p, jd: last })
    }
  }
  stations.sort((p, q) => p.day - q.day)
  return { events, moon, rx, stations, rxUntil }
}
