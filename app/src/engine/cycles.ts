// หมุดหมายรอบโคจร (ดาวจรทำมุม 0/90/180/270 กับตำแหน่งตัวเองในชาร์ตเกิด) — ใช้ในการ์ดหน้า Forecast และหน้า Cycles
import { mod, type Chart, type Pt } from './chart.ts'
import { bodyAt } from './sky.ts'
import type { Swe } from './swe.ts'

export type CycleKind = 'return' | 'sq1' | 'opp' | 'sq2'
/** ระยะ (ดาวจร − ดาวเดิม) ของแต่ละหมุดหมาย */
const ANGLE: Record<CycleKind, number> = { sq1: 90, opp: 180, sq2: 270, return: 0 }
/** คาบโคจรโดยประมาณ (ปี) — ใช้นับว่าเป็นครั้งที่เท่าไรในชีวิตเท่านั้น */
export const PERIOD: Partial<Record<Pt, number>> = { a: 1.88, J: 11.86, s: 29.46, U: 84.0, N: 164.8, P: 248.0, n: 18.6, c: 50.7 }
/** ระยะรอบตอนนี้ 0–360 (โหนดเดินถอยหลัง: นับย้อน) */
export const cycleAngle = (swe: Swe, natal: Chart, p: Pt, jd: number) => { const n0 = (p === 'c' ? natal.aspectPos : natal.pos)[p].lon; return mod(p === 'n' ? n0 - bodyAt(swe, jd, p).lon : bodyAt(swe, jd, p).lon - n0, 360) }

export interface CycleEvent {
  p: Pt
  kind: CycleKind
  /** ครั้งแรกที่ตรงพอดี (ถ้าดาวถอยหลังจะผ่านหลายรอบ) */
  jd: number
  /** ครั้งที่เท่าไรในชีวิต (1 = ครั้งแรก) */
  nth: number
}

const signed = (x: number) => mod(x + 180, 360) - 180

/** หมุดหมายถัดไปของดาว p หลัง jd0 ภายใน maxYears · หาจุดตัดด้วย bisection */
export function nextCycleEvent(swe: Swe, natal: Chart, p: Pt, jd0: number, maxYears: number): CycleEvent | null {
  // ไครอนในชาร์ตแสดงแบบ TRUEPOS — เทียบกับดาวจรใช้ค่าปกติ (aspectPos) ให้วิธีเดียวกัน
  const n0 = (p === 'c' ? natal.aspectPos : natal.pos)[p].lon
  // ดาวช้าเดินไม่ถึง 0.1°/วัน ก้าว 10 วันไม่พลาดจุดตัด
  const step = p === 'a' ? 2 : p === 'J' || p === 's' || p === 'n' ? 5 : 10
  let best: CycleEvent | null = null
  for (const kind of Object.keys(ANGLE) as CycleKind[]) {
    const f = (jd: number) => signed((p === 'n' ? n0 - bodyAt(swe, jd, p).lon : bodyAt(swe, jd, p).lon - n0) - ANGLE[kind])
    let a = jd0
    let fa = f(a)
    const end = Math.min(jd0 + maxYears * 365.25, best ? best.jd : Infinity)
    while (a < end) {
      const b = a + step
      const fb = f(b)
      // ตัดผ่าน 0 จริง (ไม่ใช่กระโดด ±180)
      if (fa <= 0 !== fb <= 0 && Math.abs(fa - fb) < 90) {
        let lo = a, hi = b, flo = fa
        for (let i = 0; i < 60 && hi - lo > 1e-6; i++) {
          const m = (lo + hi) / 2
          const fm = f(m)
          if (flo <= 0 === fm <= 0) { lo = m; flo = fm } else hi = m
        }
        const jd = (lo + hi) / 2
        const years = (jd - natal.jd) / 365.25
        const per = PERIOD[p]!
        const nth = kind === 'return' ? Math.max(1, Math.round(years / per)) : Math.floor(years / per) + 1
        best = { p, kind, jd, nth }
        break
      }
      a = b
      fa = fb
    }
  }
  return best
}

/** หมุดหมายใหญ่ที่ใกล้ที่สุด (เสาร์ ยูเรนัส เนปจูน พลูโต) */
export const MAJOR_CYCLE_PTS: Pt[] = ['s', 'U', 'N', 'P']
export function nextMajorEvent(swe: Swe, natal: Chart, jd0: number): CycleEvent | null {
  let best: CycleEvent | null = null
  for (const p of MAJOR_CYCLE_PTS) {
    // ไม่ต้องหาไกลกว่าตัวที่เจอแล้ว
    const e = nextCycleEvent(swe, natal, p, jd0, best ? (best.jd - jd0) / 365.25 : 40)
    if (e && (!best || e.jd < best.jd)) best = e
  }
  return best
}
