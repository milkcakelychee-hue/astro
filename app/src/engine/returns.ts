// ดวงรอบปี (Solar Return): ชาร์ต ณ วินาทีที่ดวงอาทิตย์กลับมาตำแหน่งเกิด ตั้งที่สถานที่เกิด (docs/08)
import { separations, type AspectType } from './aspects.ts'
import { computeChart, mod, type BirthInput, type Chart, type Pt } from './chart.ts'
import { bodyAt, dateOfJd, thaiParts } from './sky.ts'
import type { Swe } from './swe.ts'

/** ชาร์ต ณ JD ที่ตำแหน่งเดียวกับ inp — ตั้งที่นาทีเต็ม (ตัดวินาที) ตามที่ดีไซน์/astro-seek ใช้: มุมกับ AC/MC ตรงทุกคู่ */
export function chartAtJd(swe: Swe, inp: BirthInput, jd: number): Chart {
  const p = thaiParts(dateOfJd(jd))
  return computeChart(swe, { ...inp, y: p.y, mo: p.mo, d: p.d, hh: p.hh, mi: p.mi })
}

/** JD ที่ดวงอาทิตย์กลับที่เดิมในปี ค.ศ. y (ค้นรอบวันเกิด ±3 วัน) */
export function solarReturnJd(swe: Swe, natal: Chart, inp: BirthInput, y: number): number {
  const s0 = natal.pos.S.lon
  const f = (x: number) => mod(bodyAt(swe, x, 'S').lon - s0 + 180, 360) - 180
  let lo = swe.julday(y, inp.mo, inp.d, 0) - 3, hi = lo + 6
  let flo = f(lo)
  for (let i = 0; i < 60 && hi - lo > 1e-8; i++) { const m = (lo + hi) / 2, fm = f(m); if (flo <= 0 === fm <= 0) { lo = m; flo = fm } else hi = m }
  return (lo + hi) / 2
}

export const SR_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'A', 'C']
export interface SrAspect { a: Pt; b: Pt; type: AspectType; orb: number }
/** มุมเด่นในชาร์ตรอบปี: ดาว 10 ดวง + AC MC · orb ≤ 3° · เรียงจากแน่นสุด */
export function srAspects(c: Chart, max = 9): SrAspect[] {
  return separations(c.aspectPos)
    .filter((s) => SR_PTS.includes(s.a) && SR_PTS.includes(s.b) && !(s.a === 'A' && s.b === 'C') && !(s.a === 'C' && s.b === 'A') && s.orb <= 3)
    .sort((x, y) => x.orb - y.orb).slice(0, max)
}
