// หน้า "ตารางตำแหน่งดาว" (design/Ephemeris.dc.html): ตำแหน่งตอน 00:00 UT ทุกวัน ตัดเศษเป็นลิปดา · โหนด Mean
// เหตุการณ์เดือนนี้ = ดาวหยุด (ถอยหลัง/เดินหน้า) และดาวย้ายราศี อาทิตย์–พลูโต (ไม่รวมดวงจันทร์ โหนด) · เวลาไทย (docs/08)
import type { Pt } from './chart.ts'
import { bodyAt, nextIngress, SKY_PTS, thaiParts, dateOfJd } from './sky.ts'
import type { Swe } from './swe.ts'

export interface Cell { p: Pt; lon: number; sign: number; deg: number; min: number; r: boolean }
export interface EphEvent { jd: number; p: Pt; kind: 'R' | 'D' | 'in'; sign: number; lon: number }

export const EPH_PTS: Pt[] = SKY_PTS
const EV_PTS: Pt[] = ['S', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']

export function cellOf(swe: Swe, jd: number, p: Pt): Cell {
  const b = bodyAt(swe, jd, p)
  const tm = Math.floor(b.lon * 60 + 1e-9) // ตัดเศษเป็นลิปดา
  return { p, lon: b.lon, sign: Math.floor(tm / 1800) % 12, deg: Math.floor((tm % 1800) / 60), min: tm % 60, r: b.speed < 0 }
}

/** แถวรายวันของเดือน (ปฏิทินไทย = วันที่ตอน 07:00 น.) */
export function monthRows(swe: Swe, y: number, mo: number): Cell[][] {
  const n = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  return Array.from({ length: n }, (_, i) => { const jd = swe.julday(y, mo, i + 1, 0); return EPH_PTS.map((p) => cellOf(swe, jd, p)) })
}

function bisect(f: (x: number) => number, a: number, b: number) {
  let fa = f(a)
  for (let i = 0; i < 60 && b - a > 1e-7; i++) { const m = (a + b) / 2, fm = f(m); if (fa <= 0 === fm <= 0) { a = m; fa = fm } else b = m }
  return (a + b) / 2
}

/** เหตุการณ์ในเดือน (ช่วงเวลาไทย 1 → สิ้นเดือน) */
export function monthEvents(swe: Swe, y: number, mo: number): EphEvent[] {
  const a = swe.julday(y, mo, 1, -7), b = swe.julday(y, mo + 1 > 12 ? 1 : mo + 1, 1, -7) + (mo === 12 ? 365 : 0) // ปีถัดไปเมื่อ ธ.ค.
  const B = mo === 12 ? swe.julday(y + 1, 1, 1, -7) : b
  const out: EphEvent[] = []
  for (const p of EV_PTS) {
    // ดาวหยุด
    if (p !== 'S') {
      const sp = (x: number) => bodyAt(swe, x, p).speed
      let x = a, fx = sp(x)
      while (x < B) {
        const z = Math.min(x + 0.5, B), fz = sp(z)
        if (fx <= 0 !== fz <= 0) { const t = bisect(sp, x, z), l = bodyAt(swe, t, p).lon; out.push({ jd: t, p, kind: fz < 0 ? 'R' : 'D', sign: Math.floor(l / 30), lon: l }) }
        x = z; fx = fz
      }
    }
    // ย้ายราศี
    let t = a
    for (;;) { const ig = nextIngress(swe, t, p, B - t); if (!ig || ig.jd >= B) break; out.push({ jd: ig.jd, p, kind: 'in', sign: ig.sign, lon: ig.sign * 30 }); t = ig.jd + 0.01 }
  }
  return out.sort((x, y) => x.jd - y.jd)
}
export const thaiOf = (jd: number) => thaiParts(dateOfJd(jd))
