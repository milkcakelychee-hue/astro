// หน้า "ปฏิทินดวงจันทร์" (design/MoonPhases.dc.html): ข้างขึ้นแรมรายวัน + จันทร์ว่าง (VOC) ทั้งเดือน
import type { AspectType } from './aspects.ts'
import { mod, type Pt } from './chart.ts'
import { bodyAt, moonInfo, nextIngress, vocBefore, type MoonInfo } from './sky.ts'
import type { Swe } from './swe.ts'

export interface Voc { start: number; end: number; p: Pt; type: AspectType; sign: number }
export interface MoonDay { d: number; noon: number; info: MoonInfo; sign: number }
export interface MoonMonth { days: MoonDay[]; vocs: Voc[]; jd0: number; jd1: number }

/** เดือน y/mo (เวลาไทย) */
export function moonMonth(swe: Swe, y: number, mo: number): MoonMonth {
  const n = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  const jd0 = swe.julday(y, mo, 1, -7), jd1 = jd0 + n
  const days: MoonDay[] = []
  for (let d = 1; d <= n; d++) {
    const noon = jd0 + d - 1 + 0.5
    const info = moonInfo(swe, noon)
    days.push({ d, noon, info, sign: Math.floor(info.lon / 30) })
  }
  const vocs: Voc[] = []
  let t = jd0 - 3
  for (;;) {
    const ing = nextIngress(swe, t, 'M', 4)
    if (!ing || ing.jd > jd1 + 3) break
    const v = vocBefore(swe, ing.jd - 1e-4, ing.jd)
    if (v && v.end > jd0 && v.start < jd1) vocs.push({ ...v, sign: ing.sign })
    t = ing.jd + 0.01
  }
  return { days, vocs, jd0, jd1 }
}

/** จันทร์ดับครั้งถัดไปหลัง jd */
export function nextNewMoon(swe: Swe, jd: number): number {
  const el = (x: number) => mod(bodyAt(swe, x, 'M').lon - bodyAt(swe, x, 'S').lon + 180, 360) - 180
  let a = jd, fa = el(a)
  for (;;) {
    const b = a + 0.5, fb = el(b)
    if (fa < 0 && fb >= 0) {
      let lo = a, hi = b
      for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (el(m) < 0) lo = m; else hi = m }
      return (lo + hi) / 2
    }
    a = b; fa = fb
  }
}
