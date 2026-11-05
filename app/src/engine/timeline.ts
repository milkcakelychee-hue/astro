// ไทม์ไลน์ชีวิต (design/Timeline.dc.html): ดาวช้าทำมุมพอดีกับชาร์ตเกิด จัดกลุ่มรอบที่ดาวถอยหลังผ่านซ้ำ
// เกณฑ์ (ผู้ใช้เลือก 5 พ.ย. 2569): ดาวจร J s U N P × ดาวเกิด S M m V a J s + AC MC · มุม ☌ □ △ ☍ (ไม่รวม ⚹)
import type { AspectType } from './aspects.ts'
import { mod, type Chart, type Pt } from './chart.ts'
import { bodyAt } from './sky.ts'
import type { Swe } from './swe.ts'

export const TL_TRANSIT: Pt[] = ['J', 's', 'U', 'N', 'P']
export const TL_NATAL: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'A', 'C']
const SIDES: [number, AspectType][] = [[0, '0'], [90, '4'], [270, '4'], [120, '3'], [240, '3'], [180, '8']]
/** รอบที่ห่างกันไม่เกินนี้ (วัน) = ช่วงเดียวกัน (ดาวถอยหลังผ่านซ้ำ) */
const GROUP_GAP = 300
/** ช่วงที่มีผล: ก่อนรอบแรก/หลังรอบสุดท้าย (วัน) ตามดีไซน์ */
export const SPAN_PAD = 45

export type TlKind = 'opp' | 'test' | 'change'
export interface TlEvent { t: Pt; type: AspectType; n: Pt; passes: number[]; kind: TlKind; big: boolean }

const hardT = (a: AspectType) => a === '0' || a === '4' || a === '8'
/** โอกาส = พฤหัสทุกมุม หรือ △ · บททดสอบ = เสาร์มุมแรง · เปลี่ยนแปลง = ดาววงนอกมุมแรง */
export function tlKind(t: Pt, a: AspectType): TlKind {
  if (t === 'J' || !hardT(a)) return 'opp'
  return t === 's' ? 'test' : 'change'
}
/** ครั้งใหญ่ = ดาววงนอกมุมแรงกับ อาทิตย์/จันทร์/ลัคนา/กลางฟ้า · Saturn Return · พฤหัสกุมลัคนา/กลางฟ้า */
export function tlBig(t: Pt, a: AspectType, n: Pt): boolean {
  if ((t === 'U' || t === 'N' || t === 'P') && hardT(a) && 'SMAC'.includes(n)) return true
  if (t === 's' && a === '0' && n === 's') return true
  return t === 'J' && a === '0' && (n === 'A' || n === 'C')
}

/** เหตุการณ์ที่รอบใดรอบหนึ่งอยู่ใน [a, b] (JD) */
export function timelineEvents(swe: Swe, natal: Chart, a: number, b: number, withAngles: boolean): TlEvent[] {
  const out: TlEvent[] = []
  const nat = withAngles ? TL_NATAL : TL_NATAL.filter((p) => p !== 'A' && p !== 'C')
  // ค้นกว้างกว่าช่วง เพื่อให้รอบถอยหลังที่อยู่นอกช่วงยังอยู่ในกลุ่มเดียวกัน
  const A = a - GROUP_GAP, B = b + GROUP_GAP
  for (const t of TL_TRANSIT) {
    const step = t === 'J' ? 2 : 4
    const lons: number[] = []
    for (let x = A; x <= B + step; x += step) lons.push(bodyAt(swe, x, t).lon)
    for (const n of nat) {
      const nl = natal.pos[n].lon
      for (const [ang, type] of SIDES) {
        const f = (x: number) => mod(bodyAt(swe, x, t).lon - nl - ang + 180, 360) - 180
        const g = (i: number) => mod(lons[i] - nl - ang + 180, 360) - 180
        const hits: number[] = []
        for (let i = 0; A + (i + 1) * step <= B + step && i + 1 < lons.length; i++) {
          const f0 = g(i), f1 = g(i + 1)
          if (f0 <= 0 === f1 <= 0 || Math.abs(f0 - f1) > 90) continue
          let lo = A + i * step, hi = lo + step, flo = f0
          for (let k = 0; k < 50 && hi - lo > 1e-6; k++) {
            const m = (lo + hi) / 2, fm = f(m)
            if (flo <= 0 === fm <= 0) { lo = m; flo = fm } else hi = m
          }
          hits.push((lo + hi) / 2)
        }
        // จัดกลุ่ม
        let grp: number[] = []
        const flush = () => {
          if (grp.length && grp.some((x) => x >= a && x <= b)) out.push({ t, type, n, passes: grp, kind: tlKind(t, type), big: tlBig(t, type, n) })
          grp = []
        }
        for (const h of hits) { if (grp.length && h - grp[grp.length - 1] > GROUP_GAP) flush(); grp.push(h) }
        flush()
      }
    }
  }
  return out.sort((p, q) => p.passes[0] - q.passes[0])
}
