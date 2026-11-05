// ดาวเด่น (Modern) · ธาตุเด่น · Signature Sign ตาม docs/01-calc-recipe.md
// แปลงจาก engine/domall.py + signtab.py
import { PLANETS, type Chart, type Pt } from './chart.ts'
import { separations, type AspectType } from './aspects.ts'

/** ผู้ครองราศีแบบ Modern (เมษ→มีน) */
const RULER: Pt[] = ['a', 'V', 'm', 'M', 'S', 'm', 'V', 'P', 'J', 's', 'U', 'N']
/** ผู้ครองเรือน 1–12 */
const HOUSE_RULER: Record<number, Pt> = { 1: 'a', 2: 'V', 3: 'm', 4: 'M', 5: 'S', 6: 'm', 7: 'V', 8: 'P', 9: 'J', 10: 's', 11: 'U', 12: 'N' }

/** คะแนน Sign: แถว = ดาว (S M m V a J s U N P), คอลัมน์ = เมษ→มีน
 *  6 เกษตร · 5 อุจ · 4 ราศีมิตร · 3 กลาง · 2 ศัตรู · 1 ประ · 0 นิจ */
const SIGN_TABLE: Record<string, number[]> = {
  S: [5, 3, 2, 3, 6, 3, 1, 3, 4, 3, 0, 3],
  M: [3, 5, 3, 6, 3, 2, 3, 1, 3, 0, 3, 4],
  m: [2, 4, 6, 2, 2, 6, 4, 2, 0, 4, 4, 0],
  V: [0, 6, 4, 2, 2, 1, 6, 0, 2, 4, 4, 5],
  a: [6, 0, 2, 1, 4, 2, 0, 6, 4, 5, 2, 4],
  J: [4, 2, 0, 5, 4, 0, 2, 4, 6, 1, 2, 6],
  s: [1, 4, 4, 0, 0, 4, 5, 2, 2, 6, 6, 2],
  U: [2, 1, 4, 2, 0, 4, 4, 5, 2, 4, 6, 2],
  N: [3, 2, 2, 5, 2, 0, 3, 4, 4, 1, 5, 6],
  P: [5, 0, 2, 3, 4, 4, 1, 6, 2, 3, 2, 3],
}

const ASPECT_WEIGHT: Record<AspectType, number> = { '3': 3, '6': 3, '0': 2, '4': 1, '8': 1 }
/** orb ของคะแนน Aspects: 5° ทุกมุม ยกเว้น sextile 4° (มีอาทิตย์/จันทร์ 5°) — ใช้ระยะจริง ไม่ปัด */
const SCORE_ORB = { '0': 5, '4': 5, '3': 5, '8': 5, '6': 4, '6L': 5 }

export const signOf = (lon: number) => Math.floor(lon / 30) % 12

export interface DominantRow {
  planet: Pt
  sign: number
  house: number
  angle: number
  ruler: number
  aspects: number
  total: number
}

export interface Dominants {
  rows: DominantRow[]
  sum: number
}

export function dominants(chart: Chart): Dominants {
  const r = chart.pos
  const q = chart.aspectPos
  const A = r.A.lon
  const C = r.C.lon

  const asp: Record<string, number> = Object.fromEntries(PLANETS.map((p) => [p, 0]))
  for (const s of separations(q)) {
    if (!PLANETS.includes(s.a) || !PLANETS.includes(s.b)) continue
    const lum = s.a === 'S' || s.a === 'M' || s.b === 'S' || s.b === 'M'
    const lim = s.type === '6' ? (lum ? SCORE_ORB['6L'] : SCORE_ORB['6']) : SCORE_ORB[s.type]
    if (s.orb <= lim) {
      asp[s.a]! += ASPECT_WEIGHT[s.type]
      asp[s.b]! += ASPECT_WEIGHT[s.type]
    }
  }

  const rows = PLANETS.map((p): DominantRow => {
    const lon = r[p].lon
    const hs = chart.house(lon)
    const sign = SIGN_TABLE[p]![signOf(lon)]!
    const house = (hs === 1 || hs === 10 ? 1 : 0) + (HOUSE_RULER[hs] === p ? 1 : 0)
    let angle = 0
    for (const [k, v] of [['C', 5], ['A', 5], ['I', 3], ['D', 3]] as const) {
      let d = Math.abs(lon - r[k].lon) % 360
      d = Math.min(d, 360 - d)
      if (d <= 6) angle += v
    }
    const ruler =
      (RULER[signOf(A)] === p ? 3 : 0) +
      (RULER[signOf(C)] === p ? 1 : 0) +
      PLANETS.filter((x) => RULER[signOf(r[x].lon)] === p).length
    const aspects = asp[p]!
    return { planet: p, sign, house, angle, ruler, aspects, total: sign + house + angle + ruler + aspects }
  })
  return { rows, sum: rows.reduce((t, x) => t + x.total, 0) }
}

/** ธาตุ: 0 ไฟ 1 ดิน 2 ลม 3 น้ำ (index ราศี % 4) */
export const elementOfSign = (s: number) => s % 4
/** ลักษณะ: 0 Cardinal 1 Fixed 2 Mutable (index ราศี % 3) */
export const modalityOfSign = (s: number) => s % 3

export interface ElementScore {
  /** อาทิตย์ จันทร์ ASC (+3) */
  lights: number
  /** พุธ ศุกร์ อังคาร พฤหัส (+2) */
  inner: number
  /** เสาร์ ยูเรนัส เนปจูน พลูโต (+1) */
  outer: number
  /** ดาวเด่น 3 อันดับแรก (+2) */
  top3: number
  total: number
}

/** ธาตุเด่น: ผลลัพธ์ 4 ช่อง ไฟ ดิน ลม น้ำ */
export function dominantElements(chart: Chart, dom: Dominants): ElementScore[] {
  const out: ElementScore[] = [0, 1, 2, 3].map(() => ({ lights: 0, inner: 0, outer: 0, top3: 0, total: 0 }))
  const el = (p: Pt) => elementOfSign(signOf(chart.pos[p].lon))
  for (const p of ['S', 'M', 'A'] as Pt[]) out[el(p)]!.lights += 3
  for (const p of ['m', 'V', 'a', 'J'] as Pt[]) out[el(p)]!.inner += 2
  for (const p of ['s', 'U', 'N', 'P'] as Pt[]) out[el(p)]!.outer += 1
  // เรียงคะแนนสูง→ต่ำ; เสมอกันให้ลำดับดาวตามปกติ (S M m V a J s U N P)
  const top = [...dom.rows].sort((x, y) => y.total - x.total).slice(0, 3)
  for (const row of top) out[el(row.planet)]!.top3 += 2
  for (const e of out) e.total = e.lights + e.inner + e.outer + e.top3
  return out
}

export type Signature = { ambiguous: true } | { ambiguous: false; sign: number; elementCount: number; modalityCount: number }

/** Signature Sign: นับธาตุ+ลักษณะของดาว 10 ดวง; เสมอ → บวก ASC ทั้งสองฝั่ง; ยังเสมอ → Ambiguous */
export function signature(chart: Chart): Signature {
  const count = (withAsc: boolean) => {
    const el = [0, 0, 0, 0]
    const mo = [0, 0, 0]
    const pts: Pt[] = withAsc ? [...PLANETS, 'A'] : PLANETS
    for (const p of pts) {
      const s = signOf(chart.pos[p].lon)
      el[elementOfSign(s)]!++
      mo[modalityOfSign(s)]!++
    }
    return { el, mo }
  }
  const lead = (a: number[]) => {
    const m = Math.max(...a)
    const idx = a.flatMap((v, i) => (v === m ? [i] : []))
    return { max: m, idx }
  }
  let c = count(false)
  let le = lead(c.el)
  let lm = lead(c.mo)
  if (le.idx.length > 1 || lm.idx.length > 1) {
    c = count(true)
    le = lead(c.el)
    lm = lead(c.mo)
    if (le.idx.length > 1 || lm.idx.length > 1) return { ambiguous: true }
  }
  const e = le.idx[0]!
  const m = lm.idx[0]!
  let sign = -1
  for (let s = 0; s < 12; s++) if (elementOfSign(s) === e && modalityOfSign(s) === m) sign = s
  return { ambiguous: false, sign, elementCount: le.max, modalityCount: lm.max }
}
