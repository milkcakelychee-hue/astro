// หน้า Transit (design/Transit.dc.html): ทรานซิตตอนนี้ + เข้าใกล้/ห่างออก + วันที่ตรงพอดีของรอบนี้
import { ANGLE_DEG } from './aspects.ts'
import { mod, type Chart } from './chart.ts'
import { bodyAt, transitOrb, transitsNow, type Transit } from './sky.ts'
import type { Swe } from './swe.ts'

export interface TransitRow extends Transit {
  /** true = เข้าใกล้ (Applying) */
  applying: boolean
  /** orb / orb สูงสุด (0 = ตรงพอดี) */
  f: number
  /** วันที่ตรงพอดีในรอบนี้ (ดาวถอยหลังผ่านหลายครั้ง) — ว่างสำหรับดวงจันทร์ */
  passes: number[]
}

const SLOW = 'JsUNP'
function orbAt(swe: Swe, jd: number, tr: Transit, ln: number) {
  let d = Math.abs(bodyAt(swe, jd, tr.t).lon - ln) % 360
  d = Math.min(d, 360 - d)
  return Math.abs(d - ANGLE_DEG[tr.type])
}

/** วันที่มุมตรงพอดีของกลุ่มรอบที่ใกล้ jd ที่สุด */
export function exactPasses(swe: Swe, natal: Chart, tr: Transit, jd: number): number[] {
  if (tr.t === 'M') return []
  const slow = SLOW.includes(tr.t)
  const W = slow ? 420 : 60, GAP = slow ? 300 : 40, step = slow ? 2 : 0.5
  const ln = natal.aspectPos[tr.n].lon
  const angs = tr.type === '0' || tr.type === '8' ? [ANGLE_DEG[tr.type]] : [ANGLE_DEG[tr.type], 360 - ANGLE_DEG[tr.type]]
  const hits: number[] = []
  for (const ang of angs) {
    const f = (x: number) => mod(bodyAt(swe, x, tr.t).lon - ln - ang + 180, 360) - 180
    let x = jd - W, fx = f(x)
    while (x < jd + W) {
      const y = x + step, fy = f(y)
      if (fx <= 0 !== fy <= 0 && Math.abs(fx - fy) < 90) {
        let lo = x, hi = y, fl = fx
        for (let i = 0; i < 50 && hi - lo > 1e-6; i++) { const m = (lo + hi) / 2, fm = f(m); if (fl <= 0 === fm <= 0) { lo = m; fl = fm } else hi = m }
        hits.push((lo + hi) / 2)
      }
      x = y; fx = fy
    }
  }
  hits.sort((a, b) => a - b)
  // แบ่งกลุ่ม แล้วเลือกกลุ่มที่ใกล้ jd ที่สุด
  const groups: number[][] = []
  for (const h of hits) { const g = groups[groups.length - 1]; if (g && h - g[g.length - 1] <= GAP) g.push(h); else groups.push([h]) }
  const dist = (g: number[]) => (jd < g[0] ? g[0] - jd : jd > g[g.length - 1] ? jd - g[g.length - 1] : 0)
  return groups.sort((a, b) => dist(a) - dist(b))[0] ?? []
}

export function transitRows(swe: Swe, natal: Chart, jd: number, withAngles: boolean): TransitRow[] {
  return transitsNow(swe, jd, natal, withAngles).filter((t) => t.n !== 'n').map((t) => {
    const ln = natal.aspectPos[t.n].lon
    const applying = orbAt(swe, jd + 0.01, t, ln) < t.orb
    return { ...t, applying, f: t.orb / transitOrb(t.t), passes: exactPasses(swe, natal, t, jd) }
  })
}
