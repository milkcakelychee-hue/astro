// หน้า "หาฤกษ์" (design/Electional.dc.html) — ข้อมูลดาวรายวัน 30 วัน · เวลาไทย
// เกณฑ์คะแนนตั้งเอง: docs/04-product-decisions.md (ไม่มีใน astro-seek)
import { ANGLE_DEG, type AspectType } from './aspects.ts'
import { mod, type Pt } from './chart.ts'
import { bodyAt, nextIngress, vocBefore } from './sky.ts'
import type { Swe } from './swe.ts'

const PTS: Pt[] = ['S', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']
export interface MoonAsp { h: number; p: Pt; type: AspectType }
export interface ElDay {
  y: number; mo: number; d: number
  /** ราศีจันทร์ 0–11 และมุมห่างจันทร์–อาทิตย์ ตอน 12:00 น. */
  sign: number; elong: number
  mercR: boolean; venR: boolean
  /** มุมหลักที่จันทร์ทำตรงพอดีช่วง 08:00–20:00 น. (h = ชั่วโมงไทยทศนิยม) */
  asp: MoonAsp[]
  /** ช่วงจันทร์ว่างในวันนี้ [นาทีเริ่ม, นาทีจบ] 0–1440 */
  voc: [number, number] | null
}

function bisect(f: (x: number) => number, a: number, b: number) {
  let fa = f(a)
  for (let i = 0; i < 60 && b - a > 1e-7; i++) { const m = (a + b) / 2, fm = f(m); if (fa <= 0 === fm <= 0) { a = m; fa = fm } else b = m }
  return (a + b) / 2
}
const signed = (x: number) => mod(x + 180, 360) - 180

/** n วันตั้งแต่ y-mo-d (เวลาไทย) */
export function electionalDays(swe: Swe, y: number, mo: number, d: number, n: number): ElDay[] {
  const jd0 = swe.julday(y, mo, d, -7) // 00:00 น. ไทย
  // ช่วงจันทร์ว่างทั้งช่วง
  const vocs: [number, number][] = []
  let t = jd0 - 3
  for (;;) {
    const ig = nextIngress(swe, t, 'M', jd0 + n + 3 - t)
    if (!ig) break
    const v = vocBefore(swe, ig.jd - 0.001, ig.jd)
    if (v) vocs.push([v.start, v.end])
    t = ig.jd + 0.01
  }
  const out: ElDay[] = []
  for (let k = 0; k < n; k++) {
    const a = jd0 + k
    const dt = new Date((a + 7 / 24 - 2440587.5) * 86400000)
    const noon = a + 0.5
    const M = bodyAt(swe, noon, 'M').lon, S = bodyAt(swe, noon, 'S').lon
    const asp: MoonAsp[] = []
    const w0 = a + 8 / 24, step = 1 / 24
    // ตำแหน่งรายชั่วโมง 08–20 น. คำนวณครั้งเดียว แล้ว bisect เฉพาะช่วงที่ข้ามมุม
    const hrs = Array.from({ length: 13 }, (_, i) => w0 + i * step)
    const mL = hrs.map((x) => bodyAt(swe, x, 'M').lon)
    for (const p of PTS) {
      const pL = hrs.map((x) => bodyAt(swe, x, p).lon)
      for (const type of Object.keys(ANGLE_DEG) as AspectType[]) {
        const ang = ANGLE_DEG[type]
        for (const sg of ang === 0 || ang === 180 ? [1] : [1, -1]) {
          const g = (i: number) => signed(mL[i]! - pL[i]! - sg * ang)
          const f = (x: number) => signed(bodyAt(swe, x, 'M').lon - bodyAt(swe, x, p).lon - sg * ang)
          for (let i = 0; i < 12; i++) {
            const fx = g(i), fz = g(i + 1)
            if (fx <= 0 !== fz <= 0 && Math.abs(fx - fz) < 90) asp.push({ h: (bisect(f, hrs[i]!, hrs[i + 1]!) - a) * 24, p, type })
          }
        }
      }
    }
    asp.sort((u, v) => u.h - v.h)
    let voc: [number, number] | null = null
    for (const [s, e] of vocs) {
      if (e <= a || s >= a + 1) continue
      // นาทีไทย: เริ่มปัดลง จบปัดลง (ตามหน้า Today/MoonPhases)
      voc = [Math.max(0, Math.floor((s - a) * 1440 + 1e-6)), Math.min(1440, Math.floor((e - a) * 1440 + 1e-6))]
    }
    out.push({ y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate(), sign: Math.floor(M / 30), elong: mod(M - S, 360), mercR: bodyAt(swe, noon, 'm').speed < 0, venR: bodyAt(swe, noon, 'V').speed < 0, asp, voc })
  }
  return out
}
