// จันทร์ดับ/จันทร์เต็ม (design/Lunations.dc.html): เวลาตรงพอดี (bisection) เรือนที่ตก มุมกับดาวเกิด orb 3° และคราส
import type { AspectType } from './aspects.ts'
import { mod, type Chart, type Pt } from './chart.ts'
import { bodyAt } from './sky.ts'
import type { Swe } from './swe.ts'

export type EclipseKind = 'sol_total' | 'sol_annular' | 'sol_hybrid' | 'sol_partial' | 'lun_total' | 'lun_partial' | 'lun_penumbral'
export interface LunAspect { type: AspectType; n: Pt; orb: number }
export interface Lunation { full: boolean; jd: number; lon: number; house: number; aspects: LunAspect[]; eclipse: EclipseKind | null }

const NATAL: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'A', 'C']
const ASP: [AspectType, number][] = [['0', 0], ['4', 90], ['3', 120], ['8', 180]]
export const LUN_ORB = 3

function eclipseAt(swe: Swe, jd: number, full: boolean): EclipseKind | null {
  const r = full ? swe.lun_eclipse_when(jd - 2, 2, 0, 0) : swe.sol_eclipse_when_glob(jd - 2, 2, 0, 0)
  if (!r || Math.abs(r.tret[0] - jd) > 1) return null
  const f = r.retFlag
  if (full) return f & 4 ? 'lun_total' : f & 16 ? 'lun_partial' : 'lun_penumbral'
  return f & 32 ? 'sol_hybrid' : f & 4 ? 'sol_total' : f & 8 ? 'sol_annular' : 'sol_partial'
}

/** จันทร์ดับ/เต็มทั้งหมดใน [a, b) (JD) */
export function lunations(swe: Swe, natal: Chart, a: number, b: number, withAngles: boolean): Lunation[] {
  const out: Lunation[] = []
  const el = (x: number) => mod(bodyAt(swe, x, 'M').lon - bodyAt(swe, x, 'S').lon, 360)
  const nat = withAngles ? NATAL : NATAL.filter((p) => p !== 'A' && p !== 'C')
  for (const [full, c] of [[false, 0], [true, 180]] as const) {
    const f = (x: number) => mod(el(x) - c + 180, 360) - 180
    let x = a, fx = f(x)
    while (x < b) {
      const y = x + 0.25, fy = f(y)
      if (fx <= 0 !== fy <= 0 && Math.abs(fx - fy) < 90) {
        let lo = x, hi = y, fl = fx
        for (let i = 0; i < 50 && hi - lo > 1e-7; i++) { const m = (lo + hi) / 2, fm = f(m); if (fl <= 0 === fm <= 0) { lo = m; fl = fm } else hi = m }
        const jd = (lo + hi) / 2
        const lon = bodyAt(swe, jd, 'M').lon
        const aspects: LunAspect[] = []
        for (const n of nat) {
          let d = Math.abs(lon - natal.aspectPos[n].lon) % 360
          d = Math.min(d, 360 - d)
          for (const [type, ang] of ASP) if (Math.abs(d - ang) <= LUN_ORB) aspects.push({ type, n, orb: Math.abs(d - ang) })
        }
        out.push({ full, jd, lon, house: natal.house(lon), aspects, eclipse: eclipseAt(swe, jd, full) })
      }
      x = y; fx = fy
    }
  }
  return out.sort((p, q) => p.jd - q.jd)
}
