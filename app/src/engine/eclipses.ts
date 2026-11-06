// หน้า "สุริยุปราคา จันทรุปราคา" (design/Eclipses.dc.html)
// เวลา = จุดสูงสุด (floor นาที) · องศา = ลองจิจูดดวงจันทร์ตอนสูงสุด (floor) — docs/08 · ระดับผล: docs/04
import { mod, type Chart, type Pt } from './chart.ts'
import { bodyAt } from './sky.ts'
import type { Swe } from './swe.ts'

export type EKind = 'total' | 'annular' | 'hybrid' | 'partial' | 'penumbral'
export interface EHit { p: Pt; type: '0' | '8'; orb: number }
export interface Eclipse { sun: boolean; kind: EKind; jd: number; lon: number; house: number | null; hits: EHit[]; level: 1 | 2 | 3; vis: 'yes' | 'low' | 'no' }

const HIT_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'A', 'C'] // ตามดีไซน์: ไม่นับโหนด
/** กรุงเทพฯ — ใช้ดูว่าเห็นในไทยไหม */
const BKK = [100.5, 13.75, 0]

export function eclipses(swe: Swe, natal: Chart | null, withAngles: boolean, a: number, b: number): Eclipse[] {
  const out: Eclipse[] = []
  for (const sun of [true, false]) {
    let t = a
    for (;;) {
      const r = sun ? swe.sol_eclipse_when_glob(t, 2, 0, 0) : swe.lun_eclipse_when(t, 2, 0, 0)
      if (!r || r.tret[0]! > b) break
      // astro-seek (เทียบ 6 พ.ย. 2569 ครบ 2569–2572): จันทรุปราคาเร็วกว่า Swiss Ephemeris ปัจจุบัน ~8–11 วินาที → ลบ 10 วินาที ตรงทุกครั้ง
      const jd = r.tret[0]! - (sun ? 0 : 10 / 86400), f = r.retFlag
      const kind: EKind = sun ? (f & 32 ? 'hybrid' : f & 4 ? 'total' : f & 8 ? 'annular' : 'partial') : f & 4 ? 'total' : f & 16 ? 'partial' : 'penumbral'
      // องศา = ตำแหน่งดวงจันทร์ ณ นาทีที่แสดง (ตัดวินาที) — ตรง astro-seek 14/14
      const jdMin = Math.floor((jd + 0.5) * 1440) / 1440 - 0.5
      const lon = bodyAt(swe, jdMin, 'M').lon
      const hits: EHit[] = []
      if (natal) for (const p of HIT_PTS) {
        if (!withAngles && (p === 'A' || p === 'C')) continue
        const d = Math.abs(mod(lon - natal.pos[p].lon + 180, 360) - 180)
        if (d <= 5) hits.push({ p, type: '0', orb: d })
        else if (180 - d <= 5) hits.push({ p, type: '8', orb: 180 - d })
      }
      hits.sort((x, y) => x.orb - y.orb)
      const level = !hits.length ? 1 : hits.some((h) => h.orb <= 2 || ((h.p === 'S' || h.p === 'M') && h.orb <= 3)) ? 3 : 2
      let vis: Eclipse['vis'] = 'no'
      const how = sun ? swe.sol_eclipse_how(jd, 2, BKK) : swe.lun_eclipse_how(jd, 2, BKK)
      if (how) {
        const alt = how.attr[5] ?? -90
        if (sun) vis = (how.attr[0] ?? 0) > 0 && alt > 0 ? 'yes' : 'no'
        else vis = alt >= 10 ? 'yes' : alt > -3 ? 'low' : 'no'
      }
      out.push({ sun, kind, jd, lon, house: natal && withAngles ? natal.house(lon) : null, hits, level: level as 1 | 2 | 3, vis })
      t = r.tret[0]! + 20
    }
  }
  return out.sort((x, y) => x.jd - y.jd)
}
