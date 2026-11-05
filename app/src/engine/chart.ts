// คำนวณตำแหน่งดาว เรือน Vertex Fortune ตามสูตร docs/01-calc-recipe.md
// แปลงจาก engine/eng2.py (calc) + engine/asp2.py (full)
import { DELTAT_AUTOMATIC, ECL_NUT, SPEED, SWIEPH, TRUEPOS, type Swe } from './swe.ts'

/** รหัสจุด (ตรงกับคีย์คลัง): S อาทิตย์ M จันทร์ m พุธ V ศุกร์ a อังคาร J พฤหัส s เสาร์ U ยูเรนัส N เนปจูน P พลูโต
 *  n โหนดเหนือ(Mean) L ลิลิธ(Mean) c ไครอน F Fortune X Vertex A ASC C MC D DSC I IC */
export type Pt = 'S' | 'M' | 'm' | 'V' | 'a' | 'J' | 's' | 'U' | 'N' | 'P' | 'n' | 'L' | 'c' | 'F' | 'X' | 'A' | 'C' | 'D' | 'I'

/** ลำดับจุดที่ใช้คิดมุม (ตามไฟล์อ้างอิง asp2.py) */
export const POINT_ORDER: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n', 'L', 'c', 'F', 'X', 'A', 'C', 'D', 'I']
/** ดาว 10 ดวง */
export const PLANETS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']

const SWE_IDS: Record<string, number> = { S: 0, M: 1, m: 2, V: 3, a: 4, J: 5, s: 6, U: 7, N: 8, P: 9, n: 10, L: 12, c: 15 }

export interface BirthInput {
  y: number
  mo: number
  d: number
  /** เวลาไทย (UTC+7) */
  hh: number
  mi: number
  lat: number
  lon: number
}

export interface Placement {
  lon: number
  /** ความเร็ว องศา/วัน (ลบ = ถอยหลัง) */
  speed: number
}

export interface Chart {
  jd: number
  /** ตำแหน่งที่แสดงผล (ไครอนใช้ TRUEPOS) */
  pos: Record<Pt, Placement>
  /** ตำแหน่งที่ใช้คิดมุม (ไครอนปกติ, MC/IC แบบ mean obliquity) */
  aspectPos: Record<Pt, Placement>
  /** ปลายเรือน 1–12 → index 0–11 */
  cusps: number[]
  house: (lon: number) => number
}

export function houseOf(cusps: number[], l: number): number {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i]!
    const b = cusps[(i + 1) % 12]!
    if (mod(l - a, 360) < mod(b - a, 360)) return i + 1
  }
  return 0
}

export const mod = (x: number, m: number) => ((x % m) + m) % m

/** คำนวณชาร์ต; offsetMin ใช้เลื่อนเวลาเพื่อหาความเร็ว/Applying-Separating */
export function computeChart(swe: Swe, inp: BirthInput, offsetMin = 0): Chart {
  const ut = inp.hh + inp.mi / 60 - 7 + offsetMin / 60
  const jd = swe.julday(inp.y, inp.mo, inp.d, ut)
  // ΔT = floor(ΔT ตั้งต้น เป็นวินาที)
  swe.set_delta_t_userdef(DELTAT_AUTOMATIC)
  const dt = swe.deltat(jd) * 86400
  swe.set_delta_t_userdef(Math.floor(dt) / 86400)
  try {
    const F = SWIEPH | SPEED
    const pos = {} as Record<Pt, Placement>
    for (const [k, id] of Object.entries(SWE_IDS)) {
      const x = swe.calc_ut(jd, id, F | (k === 'c' ? TRUEPOS : 0))
      pos[k as Pt] = { lon: x[0]!, speed: x[3]! }
    }
    const h = swe.houses(jd, inp.lat, inp.lon, 'P')
    const cusps: number[] = []
    for (let i = 1; i <= 12; i++) cusps.push(h.cusps[i]!)
    const asc = h.ascmc[0]!
    const mc = h.ascmc[1]!
    pos.A = { lon: asc, speed: 0 }
    pos.C = { lon: mc, speed: 0 }
    pos.D = { lon: mod(asc + 180, 360), speed: 0 }
    pos.I = { lon: mod(mc + 180, 360), speed: 0 }

    // Vertex และ ASC/MC สำหรับ Fortune/มุม: houses_armc ด้วย ARMC จาก sidereal time จริง + mean obliquity
    const eps = swe.calc_ut(jd, ECL_NUT, F)
    const armc = mod(swe.sidtime(jd) * 15 + inp.lon, 360)
    const h2 = swe.houses_armc(armc, inp.lat, eps[1]!, 'P')
    pos.X = { lon: h2.ascmc[3]!, speed: 0 }
    const asc2 = h2.ascmc[0]!
    const mc2 = h2.ascmc[1]!
    const house = (l: number) => houseOf(cusps, l)
    const day = house(pos.S.lon) >= 7
    const S = pos.S.lon
    const M = pos.M.lon
    pos.F = { lon: mod(day ? asc2 + M - S : asc2 + S - M, 360), speed: 0 }

    // ตำแหน่งสำหรับคิดมุม
    const aspectPos = { ...pos }
    const ch = swe.calc_ut(jd, 15, F)
    aspectPos.c = { lon: ch[0]!, speed: ch[3]! }
    aspectPos.C = { lon: mc2, speed: 0 }
    aspectPos.I = { lon: mod(mc2 + 180, 360), speed: 0 }

    return { jd, pos, aspectPos, cusps, house }
  } finally {
    swe.set_delta_t_userdef(DELTAT_AUTOMATIC)
  }
}

/** ตัดเศษเป็นลิปดา (floor) */
export const floorMin = (deg: number) => Math.floor(deg * 60 + 1e-9)
