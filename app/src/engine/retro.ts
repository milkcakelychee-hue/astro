// หน้า "ช่วงดาวถอยหลัง" (design/Retrograde.dc.html): จุดหยุด (bisection บนความเร็ว) + ช่วงเงา · วันที่ = เวลาไทย (docs/08)
import { mod, type Pt } from './chart.ts'
import { bodyAt } from './sky.ts'
import type { Swe } from './swe.ts'

export const RETRO_PTS: Pt[] = ['m', 'V', 'a', 'J', 's', 'U', 'N', 'P']
export interface RetroCycle {
  p: Pt
  /** เงาก่อนเริ่ม (ดาวแตะองศาที่จะหยุดเดินหน้า) */ pre: number
  /** หยุดแล้วถอยหลัง */ r: number
  /** หยุดแล้วเดินหน้า */ d: number
  /** เงาหลังจบ (ดาวกลับถึงองศาที่หยุดถอยหลัง) */ post: number
  rLon: number
  dLon: number
}

function bisect(f: (x: number) => number, a: number, b: number) {
  let fa = f(a)
  for (let i = 0; i < 60 && b - a > 1e-7; i++) { const m = (a + b) / 2, fm = f(m); if (fa <= 0 === fm <= 0) { a = m; fa = fm } else b = m }
  return (a + b) / 2
}

/** รอบถอยหลังทุกรอบที่ช่วงเงาทับ [a,b] */
export function retroCycles(swe: Swe, a: number, b: number): RetroCycle[] {
  const out: RetroCycle[] = []
  for (const p of RETRO_PTS) {
    const sp = (x: number) => bodyAt(swe, x, p).speed
    const lon = (x: number) => bodyAt(swe, x, p).lon
    // ดาวช้าเงาก่อนยาวได้ ~5 เดือน: ค้นเผื่อก่อนหลัง 300 วัน
    const A = a - 300, B = b + 300, step = p === 'm' ? 1 : 3
    const st: number[] = []
    let x = A, fx = sp(x)
    while (x < B) { const y = x + step, fy = sp(y); if (fx <= 0 !== fy <= 0) st.push(bisect(sp, x, y)); x = y; fx = fy }
    for (let i = 0; i < st.length - 1; i++) {
      const r = st[i]!, d = st[i + 1]!
      if (sp(r + 0.5) >= 0) continue // ต้องเป็นจุดเริ่มถอยหลัง
      const rLon = lon(r), dLon = lon(d)
      // เงาก่อน: ย้อนหลังจาก r หาเวลาที่ดาวอยู่ที่ dLon (ขณะเดินหน้า)
      const fPre = (t: number) => mod(lon(t) - dLon + 180, 360) - 180
      let t0 = r - step, pre = r
      while (t0 > r - 400) { if (fPre(t0) <= 0) { pre = bisect(fPre, t0, t0 + step); break } t0 -= step }
      const fPost = (t: number) => mod(lon(t) - rLon + 180, 360) - 180
      let t1 = d + step, post = d
      while (t1 < d + 400) { if (fPost(t1) >= 0) { post = bisect(fPost, t1 - step, t1); break } t1 += step }
      if (post >= a && pre <= b) out.push({ p, pre, r, d, post, rLon, dLon })
    }
  }
  return out.sort((x, y) => x.r - y.r)
}
