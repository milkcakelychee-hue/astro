// หน้า "ตัวตนฉันเติบโตไปทางไหน" (design/Growth.dc.html)
// โปรเกรส: 1 วันหลังเกิด = 1 ปี · Solar Arc: arc = อาทิตย์โปรเกรส − อาทิตย์เกิด · Primary Directions: engine/pd.py (Zodiacal, Ptolemy)
import { ANGLE_DEG, type AspectType } from './aspects.ts'
import { mod, type Chart, type Pt } from './chart.ts'
import { bodyAt } from './sky.ts'
import { ECL_NUT, type Swe } from './swe.ts'

export const YEAR = 365.25
/** JD ของชาร์ตโปรเกรส ณ วันจริง jd */
export const progJd = (natal: Chart, jd: number) => natal.jd + (jd - natal.jd) / YEAR
/** วันจริงจาก JD โปรเกรส */
const realJd = (natal: Chart, pj: number) => natal.jd + (pj - natal.jd) * YEAR

export type GKind = 'aspect' | 'ingress'
export interface GEvent { jd: number; a: Pt; type: AspectType | null; b: Pt | null; sign?: number; kind: GKind }

const TYPES: AspectType[] = ['0', '6', '4', '3', '8']
const signed = (x: number) => mod(x + 180, 360) - 180
function roots(f: (x: number) => number, a: number, b: number, step: number): number[] {
  const out: number[] = []
  let x = a, fx = f(x)
  while (x < b) {
    const y = Math.min(x + step, b), fy = f(y)
    if (fx <= 0 !== fy <= 0 && Math.abs(fx - fy) < 90) {
      let lo = x, hi = y, fl = fx
      for (let i = 0; i < 50 && hi - lo > 1e-7; i++) { const m = (lo + hi) / 2, fm = f(m); if (fl <= 0 === fm <= 0) { lo = m; fl = fm } else hi = m }
      out.push((lo + hi) / 2)
    }
    x = y; fx = fy
  }
  return out
}
/** ทุกด้านของมุม (60 กับ 300 ฯลฯ) */
const sides = (t: AspectType) => (t === '0' || t === '8' ? [ANGLE_DEG[t]] : [ANGLE_DEG[t], 360 - ANGLE_DEG[t]])

export const PROG_MOVING: Pt[] = ['S', 'M', 'm', 'V', 'a']
export const NATAL_TARGETS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n', 'A', 'C']

/** เหตุการณ์ในชาร์ตโปรเกรส ช่วงวันจริง [a,b]: ดาวโปรเกรสทำมุมพอดีกับจุดเดิม + ย้ายราศี */
export function progEvents(swe: Swe, natal: Chart, a: number, b: number, withAngles: boolean): GEvent[] {
  const pa = progJd(natal, a), pb = progJd(natal, b)
  const out: GEvent[] = []
  const targets = withAngles ? NATAL_TARGETS : NATAL_TARGETS.filter((p) => p !== 'A' && p !== 'C')
  for (const p of PROG_MOVING) {
    const lon = (x: number) => bodyAt(swe, x, p).lon
    const step = p === 'M' ? 0.5 : 2
    for (const n of targets) {
      const nl = natal.pos[n].lon
      // ดาวกับตัวเอง: นับเฉพาะกลับที่เดิม (จันทร์โปรเกรสกลับที่เดิม ~27 ปี)
      for (const t of n === p ? (['0'] as AspectType[]) : TYPES) for (const ang of sides(t)) for (const x of roots((y) => signed(lon(y) - nl - ang), pa, pb, step)) out.push({ jd: realJd(natal, x), a: p, type: t, b: n, kind: 'aspect' })
    }
    for (let s = 0; s < 12; s++) for (const x of roots((y) => signed(lon(y) - s * 30), pa, pb, step)) if (bodyAt(swe, x + 0.01, p).lon >= s * 30 && bodyAt(swe, x + 0.01, p).lon < s * 30 + 30) out.push({ jd: realJd(natal, x), a: p, type: null, b: null, sign: s, kind: 'ingress' })
  }
  return out.sort((x, y) => x.jd - y.jd)
}

/** Solar Arc ณ วันจริง jd (องศา) */
export const solarArc = (swe: Swe, natal: Chart, jd: number) => mod(bodyAt(swe, progJd(natal, jd), 'S').lon - natal.pos.S.lon, 360)
export const SA_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n', 'A', 'C']
export function saEvents(swe: Swe, natal: Chart, a: number, b: number, withAngles: boolean): GEvent[] {
  const pts = withAngles ? SA_PTS : SA_PTS.filter((p) => p !== 'A' && p !== 'C')
  // arc เดินช้าและสม่ำเสมอ: สุ่มทุก 15 วันพอ
  const cache = new Map<number, number>()
  const arc = (x: number) => { let v = cache.get(x); if (v === undefined) { v = solarArc(swe, natal, x); cache.set(x, v) } return v }
  const out: GEvent[] = []
  for (const p of pts) for (const n of pts) {
    if (n === p) continue
    const d = natal.pos[p].lon, nl = natal.pos[n].lon
    for (const t of TYPES) for (const ang of sides(t)) for (const x of roots((y) => signed(d + arc(y) - nl - ang), a, b, 15)) out.push({ jd: x, a: p, type: t, b: n, kind: 'aspect' })
  }
  return out.sort((x, y) => x.jd - y.jd)
}

// ---------- Primary Directions (port ของ engine/pd.py) ----------
const D = Math.PI / 180
export interface PD { age: number; p: Pt; asp: number; angle: 'MC' | 'IC' | 'ASC' | 'DSC'; dir: 'D' | 'C' }
export const PD_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n']
export function primaryDirections(swe: Swe, natal: Chart, lat: number, lon: number, maxAge: number): PD[] {
  const jd = natal.jd
  const eps = swe.calc_ut(jd, ECL_NUT, 0)[1]! // mean obliquity
  const ramc = mod(swe.sidtime(jd) * 15 + lon, 360)
  const phi = lat, oaA = mod(ramc + 90, 360), odD = mod(oaA + 180, 360)
  const out: PD[] = []
  for (const p of PD_PTS) {
    const L0 = bodyAt(swe, jd, p).lon
    for (const asp of [0, 60, 90, 120, 180, -60, -90, -120]) {
      const L = mod(L0 + asp, 360) * D, e = eps * D
      const ra = mod(Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L)) / D, 360)
      const de = Math.asin(Math.sin(e) * Math.sin(L)) / D
      const ad = Math.asin(Math.max(-1, Math.min(1, Math.tan(phi * D) * Math.tan(de * D)))) / D
      const oa = mod(ra - ad, 360), od = mod(ra + ad, 360)
      const arcs: [PD['angle'], number][] = [['MC', signed(ra - ramc)], ['IC', signed(ra - mod(ramc + 180, 360))], ['ASC', signed(oa - oaA)], ['DSC', signed(od - odD)]]
      for (const [angle, arc] of arcs) for (const [dir, x] of [['D', arc], ['C', -arc]] as const) if (x > 0 && x <= maxAge) out.push({ age: x, p, asp, angle, dir })
    }
  }
  return out.sort((x, y) => x.age - y.age)
}
/** แปลงทิศทางเป็นมุมกับ ASC/MC ในชาร์ตเดิม (DSC = เล็งลัคนา, IC = เล็งกลางฟ้า) */
export function pdAspect(d: PD): { type: AspectType; to: 'A' | 'C'; via: 'DSC' | 'IC' | null } {
  let a = Math.abs(d.asp)
  const via = d.angle === 'DSC' || d.angle === 'IC' ? d.angle : null
  if (via) a = 180 - a
  const type = ({ 0: '0', 60: '6', 90: '4', 120: '3', 180: '8' } as Record<number, AspectType>)[a]!
  return { type, to: d.angle === 'ASC' || d.angle === 'DSC' ? 'A' : 'C', via }
}
