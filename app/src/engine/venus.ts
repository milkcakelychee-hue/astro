// หน้า "วงโคจรดาวศุกร์" (design/VenusRose.dc.html): ดาวศุกร์กุมดวงอาทิตย์ด้านใน/นอก + เส้นทาง 8 ปีมองจากโลก
import { mod } from './chart.ts'
import { bodyAt } from './sky.ts'
import { SPEED, SWIEPH, type Swe } from './swe.ts'

export interface VConj { jd: number; lon: number; inferior: boolean }
const sep = (swe: Swe, x: number) => mod(bodyAt(swe, x, 'V').lon - bodyAt(swe, x, 'S').lon + 180, 360) - 180

/** ดาวศุกร์กุมดวงอาทิตย์ทั้งหมดใน [a,b] */
export function venusConj(swe: Swe, a: number, b: number): VConj[] {
  const out: VConj[] = []
  let x = a, fx = sep(swe, x)
  while (x < b) {
    const y = x + 2, fy = sep(swe, y)
    if (fx <= 0 !== fy <= 0 && Math.abs(fx - fy) < 90) {
      let lo = x, hi = y, fl = fx
      for (let i = 0; i < 50 && hi - lo > 1e-7; i++) { const m = (lo + hi) / 2, fm = sep(swe, m); if (fl <= 0 === fm <= 0) { lo = m; fl = fm } else hi = m }
      const jd = (lo + hi) / 2, v = bodyAt(swe, jd, 'V')
      out.push({ jd, lon: v.lon, inferior: v.speed < 0 })
    }
    x = y; fx = fy
  }
  return out
}
/** ระยะห่างจากดวงอาทิตย์ (องศา, ลบ = อยู่ทางตะวันตก = ดาวรุ่ง) */
export const venusElong = (swe: Swe, jd: number) => sep(swe, jd)
/** วันที่ห่างดวงอาทิตย์มากที่สุดใน [a,b] */
export function maxElong(swe: Swe, a: number, b: number): { jd: number; deg: number } {
  let best = { jd: a, deg: 0 }
  for (let x = a; x <= b; x += 1) { const d = Math.abs(sep(swe, x)); if (d > best.deg) best = { jd: x, deg: d } }
  // ละเอียดขึ้นรอบจุดสูงสุด (ทุก 5 นาที)
  for (let x = best.jd - 1; x <= best.jd + 1; x += 1 / 288) { const d = Math.abs(sep(swe, x)); if (d > best.deg) best = { jd: x, deg: d } }
  return best
}
/** เส้นทางดาวศุกร์มองจากโลก (ลองจิจูด + ระยะทาง AU) */
export function venusPath(swe: Swe, a: number, b: number, step = 4): { lon: number; dist: number }[] {
  const out: { lon: number; dist: number }[] = []
  for (let x = a; x <= b; x += step) { const r = swe.calc_ut(x, 3, SWIEPH | SPEED); out.push({ lon: r[0]!, dist: r[2]! }) }
  return out
}
