// เปรียบเทียบสองชาร์ต: Synastry (มุมระหว่างดาวของ A กับ B), Composite, Davison
// กฎ: docs/08 — Synastry ตรวจกับ astro-seek Love Compatibility 8/8 · แสดง orb ≤ 3°
import { ANGLE_DEG, type AspectType } from './aspects.ts'
import { computeChart, houseOf, mod, type BirthInput, type Chart, type Placement, type Pt } from './chart.ts'
import type { Swe } from './swe.ts'

const TYPES = Object.keys(ANGLE_DEG) as AspectType[]
/** ดาว 10 ดวง — ดีไซน์ Compare แสดงเฉพาะมุมระหว่างดาว (วงล้อ 12 เส้น = ทุกมุม ≤3° ของชาร์ตตัวอย่าง) */
export const SYN_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']
export const SYN_ORB = 3

export interface SynAspect {
  a: Pt
  b: Pt
  type: AspectType
  orb: number
}

export function synastry(ca: Chart, cb: Chart, maxOrb = SYN_ORB): SynAspect[] {
  const out: SynAspect[] = []
  for (const a of SYN_PTS) {
    for (const b of SYN_PTS) {
      let d = Math.abs(ca.aspectPos[a].lon - cb.aspectPos[b].lon) % 360
      d = Math.min(d, 360 - d)
      for (const t of TYPES) {
        const orb = Math.abs(d - ANGLE_DEG[t])
        if (orb <= maxOrb) out.push({ a, b, type: t, orb })
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb)
}

const floorArcmin = (deg: number) => Math.floor(deg * 60 + 1e-9) / 60

/** จุดกึ่งกลางทางสั้น */
const mid = (x: number, y: number) => {
  const d = mod(y - x, 360)
  return mod(x + (d <= 180 ? d / 2 : (d - 360) / 2), 360)
}

/** Composite (astro-seek: Midpoint method, short-arc MC midpoint — ตรวจแล้วตรงทุกค่า)
 *  ดาว = จุดกึ่งกลางทางสั้น · ปลายเรือน = จุดกึ่งกลางของปลายเรือนแต่ละคู่ โดยยึดฝั่งเดียวกับ MC กึ่งกลาง */
export function composite(ca: Chart, cb: Chart): Chart {
  const pos = {} as Record<Pt, Placement>
  for (const k of Object.keys(ca.pos) as Pt[]) pos[k] = { lon: mid(ca.pos[k].lon, cb.pos[k].lon), speed: 0 }
  const mc = mid(ca.pos.C.lon, cb.pos.C.lon)
  const cusps = ca.cusps.map((c, i) => {
    const m = mid(c, cb.cusps[i]!)
    // ระยะจาก MC ที่ควรเป็น = ค่าเฉลี่ยของสองชาร์ต · เลือกจุดกึ่งกลางฝั่งที่ใกล้กว่า (กันปลายเรือนกลับด้าน 180°)
    const want = mid(mod(c - ca.pos.C.lon, 360), mod(cb.cusps[i]! - cb.pos.C.lon, 360))
    const d = (x: number) => Math.abs(mod(x - mc - want + 180, 360) - 180)
    return d(m) <= d(mod(m + 180, 360)) ? m : mod(m + 180, 360)
  })
  pos.A = { lon: cusps[0]!, speed: 0 }
  pos.C = { lon: cusps[9]!, speed: 0 }
  pos.D = { lon: mod(cusps[0]! + 180, 360), speed: 0 }
  pos.I = { lon: mod(cusps[9]! + 180, 360), speed: 0 }
  return { jd: (ca.jd + cb.jd) / 2, pos, aspectPos: pos, cusps, house: (l) => houseOf(cusps, l) }
}

/** Davison: ชาร์ตของเวลากึ่งกลาง (JD) และพิกัดกึ่งกลาง — astro-seek ปัดพิกัดกึ่งกลางลงเป็นลิปดาเต็ม (ตรวจแล้ว AC/MC ตรง) */
export function davison(swe: Swe, a: BirthInput, b: BirthInput): Chart {
  const jd = (swe.julday(a.y, a.mo, a.d, a.hh + a.mi / 60 - 7) + swe.julday(b.y, b.mo, b.d, b.hh + b.mi / 60 - 7)) / 2
  // JD (UT) → เวลาไทย (UTC+7) ให้ computeChart · นาทีเก็บเศษไว้
  const t = new Date((jd - 2440587.5) * 86400000 + 7 * 3600000)
  const mi = t.getUTCMinutes() + t.getUTCSeconds() / 60 + t.getUTCMilliseconds() / 60000
  return computeChart(swe, { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mi, lat: floorArcmin((a.lat + b.lat) / 2), lon: floorArcmin((a.lon + b.lon) / 2) })
}
