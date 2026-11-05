// มุม (Aspect) orb และ Applying/Separating ตาม docs/01-calc-recipe.md
// แปลงจาก engine/asp2.py (seps), asfinal.py (AS/flag), xf4.py (allow)
import { POINT_ORDER, computeChart, type BirthInput, type Chart, type Placement, type Pt } from './chart.ts'
import type { Swe } from './swe.ts'

/** รหัสมุม: 0 กุม · 6 โยค(sextile) · 4 ฉาก · 3 ตรีโกณ · 8 เล็ง */
export type AspectType = '0' | '6' | '4' | '3' | '8'
export const ANGLE_DEG: Record<AspectType, number> = { '0': 0, '6': 60, '4': 90, '3': 120, '8': 180 }
const TYPES = Object.keys(ANGLE_DEG) as AspectType[]
const MAJOR_ANGLES = new Set<Pt>(['A', 'C', 'D', 'I'])

type Positions = Record<Pt, Placement>

export interface RawAspect {
  a: Pt
  b: Pt
  type: AspectType
  /** orb เป็นองศา (ยังไม่ปัด) */
  orb: number
}

export interface Aspect extends RawAspect {
  /** orb ที่แสดง (ลิปดา, floor) */
  orbMin: number
  applying: boolean
}

/** ระยะห่างของทุกคู่ × ทุกมุม (ไม่กรอง orb) */
export function separations(q: Positions): RawAspect[] {
  const out: RawAspect[] = []
  POINT_ORDER.forEach((a, i) => {
    for (const b of POINT_ORDER.slice(i + 1)) {
      let la = q[a].lon
      let lb = q[b].lon
      // คู่ Fortune–Vertex: เว็บใช้ Vertex = 0°
      if ((a === 'F' && b === 'X') || (a === 'X' && b === 'F')) {
        if (b === 'X') lb = 0
        if (a === 'X') la = 0
      }
      let d = Math.abs(la - lb) % 360
      d = Math.min(d, 360 - d)
      for (const t of TYPES) out.push({ a, b, type: t, orb: Math.abs(d - ANGLE_DEG[t]) })
    }
  })
  return out
}

/** เกณฑ์ orb ที่แสดง: มีอาทิตย์/จันทร์ → 10° (sextile 5.5°) · อื่น ๆ → 7° (sextile 4°) */
export function allowedOrb(a: Pt, b: Pt, t: AspectType): number {
  const lum = a === 'S' || a === 'M' || b === 'S' || b === 'M'
  if (t === '6') return lum ? 5.5 : 4
  return lum ? 10 : 7
}

/** มุมที่แสดงในหน้า (ไม่รวมคู่มุมหลักด้วยกัน ASC/MC/DSC/IC) */
export function visibleRaw(q: Positions): RawAspect[] {
  return separations(q).filter(
    (s) => !(MAJOR_ANGLES.has(s.a) && MAJOR_ANGLES.has(s.b)) && s.orb <= allowedOrb(s.a, s.b, s.type),
  )
}

/** ความเร็ว (องศา/วัน) จากผลต่างตำแหน่งในอีก 1 นาที */
function speedsPerDay(q: Positions, q1: Positions): Record<Pt, number> {
  const v = {} as Record<Pt, number>
  for (const k of POINT_ORDER) v[k] = ((((q1[k].lon - q[k].lon + 540) % 360) + 360) % 360 - 180) * 1440
  return v
}

function orbAt(q: Positions, v: Record<Pt, number>, a: Pt, b: Pt, t: AspectType, dt: number): number {
  const la = q[a].lon + v[a] * dt
  const lb = q[b].lon + v[b] * dt
  let d = Math.abs(la - lb) % 360
  d = Math.min(d, 360 - d)
  return Math.abs(d - ANGLE_DEG[t])
}

/** true = Applying (A) · false = Separating (S) */
export function isApplying(q: Positions, vel: Record<Pt, number>, a: Pt, b: Pt, t: AspectType): boolean {
  const w = { ...vel }
  w.X = Math.abs(w.X) // Vertex เดินหน้าเสมอ
  const inSet = (...ks: Pt[]) => ks.some((k) => k === a || k === b)
  const xf = inSet('X', 'F')
  if ((a === 'F' && b === 'X') || (a === 'X' && b === 'F')) return false
  if (xf && inSet('A', 'D')) return false
  if (xf && inSet('C', 'I')) {
    w.X = 0
    w.F = 0
  }
  return orbAt(q, w, a, b, t, 1e-6) < orbAt(q, w, a, b, t, 0)
}

export function aspectsOf(swe: Swe, inp: BirthInput, chart?: Chart): Aspect[] {
  const c0 = chart ?? computeChart(swe, inp)
  const c1 = computeChart(swe, inp, 1)
  const v = speedsPerDay(c0.aspectPos, c1.aspectPos)
  return visibleRaw(c0.aspectPos).map((s) => ({
    ...s,
    orbMin: Math.floor(s.orb * 60),
    applying: isApplying(c0.aspectPos, v, s.a, s.b, s.type),
  }))
}
