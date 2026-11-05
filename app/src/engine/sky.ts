// ท้องฟ้าตอนนี้: ตำแหน่งดาวจร ดวงจันทร์ (ข้าง/ความสว่าง) จันทร์ว่าง (VOC) วันย้ายราศี (Ingress) ทรานซิตกับชาร์ตเกิด
// กฎ: docs/08-verification-log.md — เหตุการณ์หาด้วย bisection แล้วแปลงเป็นเวลาไทย · VOC = มุมหลัก 5 มุมกับอาทิตย์–พลูโต
import { ANGLE_DEG, type AspectType } from './aspects.ts'
import { mod, type Chart, type Pt } from './chart.ts'
import { DELTAT_AUTOMATIC, SPEED, SWIEPH, type Swe } from './swe.ts'

const IDS: Partial<Record<Pt, number>> = { S: 0, M: 1, m: 2, V: 3, a: 4, J: 5, s: 6, U: 7, N: 8, P: 9, n: 10 }
/** ดาวจรที่แสดง (ดาว 10 ดวง + ราหู Mean) */
export const SKY_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n']
const VOC_PTS: Pt[] = ['S', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']
const TYPES = Object.keys(ANGLE_DEG) as AspectType[]

/** เวลาไทย → JD (UT) */
export const jdOfThai = (swe: Swe, d: Date) =>
  swe.julday(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600)
/** JD (UT) → Date (ใช้ getUTC* + 7 ชม. ผ่าน thaiParts) */
export const dateOfJd = (jd: number) => new Date((jd - 2440587.5) * 86400000)
/** แยกส่วนวันที่/เวลาแบบเวลาไทย (UTC+7 คงที่) · นาทีปัดลง */
export function thaiParts(d: Date) {
  const t = new Date(d.getTime() + 7 * 3600000)
  return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mi: t.getUTCMinutes(), wd: t.getUTCDay() }
}

export interface Body {
  lon: number
  speed: number
}

/** ตำแหน่งดาว ณ JD (ΔT floor วินาที ตาม docs/01) */
export function bodyAt(swe: Swe, jd: number, p: Pt): Body {
  swe.set_delta_t_userdef(DELTAT_AUTOMATIC)
  const dt = swe.deltat(jd) * 86400
  swe.set_delta_t_userdef(Math.floor(dt) / 86400)
  try {
    const x = swe.calc_ut(jd, IDS[p]!, SWIEPH | SPEED)
    return { lon: x[0]!, speed: x[3]! }
  } finally {
    swe.set_delta_t_userdef(DELTAT_AUTOMATIC)
  }
}
const lonAt = (swe: Swe, jd: number, p: Pt) => bodyAt(swe, jd, p).lon

/** หาเวลาที่ f เปลี่ยนเครื่องหมายระหว่าง a,b (f(a), f(b) ต่างเครื่องหมาย) ละเอียด ~0.1 วินาที */
function bisect(f: (jd: number) => number, a: number, b: number): number {
  let fa = f(a)
  for (let i = 0; i < 60 && b - a > 1e-6; i++) {
    const m = (a + b) / 2
    const fm = f(m)
    if (fa <= 0 === fm <= 0) {
      a = m
      fa = fm
    } else b = m
  }
  return (a + b) / 2
}
/** ระยะเชิงมุมแบบมีเครื่องหมาย −180..180 */
const signed = (x: number) => mod(x + 180, 360) - 180

export interface Ingress {
  jd: number
  /** ราศีที่ย้ายเข้า 0–11 */
  sign: number
}
/** หาวันย้ายราศีครั้งถัดไป (รองรับดาวถอยหลังกลับราศีเดิม) · ไม่พบภายใน maxDays → null */
export function nextIngress(swe: Swe, jd0: number, p: Pt, maxDays: number): Ingress | null {
  const s0 = Math.floor(lonAt(swe, jd0, p) / 30)
  const step = p === 'M' ? 0.25 : p === 'n' ? 5 : 1
  let prev = jd0
  for (let t = jd0 + step; t <= jd0 + maxDays; t += step) {
    const s = Math.floor(lonAt(swe, t, p) / 30)
    if (s !== s0) {
      // ขอบราศีที่ข้าม: ราศีถัดไป (เดินหน้า) หรือราศีก่อนหน้า (ถอยหลัง)
      const fwd = mod(s - s0, 12) <= 6
      const edge = fwd ? (s0 + 1) * 30 : s0 * 30
      const jd = bisect((x) => signed(lonAt(swe, x, p) - edge), prev, t)
      return { jd, sign: fwd ? mod(s0 + 1, 12) : mod(s0 - 1, 12) }
    }
    prev = t
  }
  return null
}
/** เวลาที่ดาวเข้าราศีปัจจุบัน (ย้อนหลัง) */
function prevIngress(swe: Swe, jd0: number, p: Pt, maxDays: number): number | null {
  const s0 = Math.floor(lonAt(swe, jd0, p) / 30)
  const step = 0.25
  let prev = jd0
  for (let t = jd0 - step; t >= jd0 - maxDays; t -= step) {
    if (Math.floor(lonAt(swe, t, p) / 30) !== s0) {
      return bisect((x) => (Math.floor(lonAt(swe, x, p) / 30) === s0 ? 1 : -1), t, prev)
    }
    prev = t
  }
  return null
}

// ---------- ดวงจันทร์ ----------
export interface MoonInfo {
  lon: number
  /** มุมห่างจันทร์–อาทิตย์ 0–360 */
  elong: number
  /** ความสว่าง 0–1 */
  illum: number
  /** ข้างขึ้น (true) / ข้างแรม (false) */
  waxing: boolean
  /** ค่ำ 1–15 */
  kham: number
  /** คีย์คลังหมวด moon: new … waning_crescent */
  phaseKey: string
  ingress: Ingress | null
  /** ช่วงจันทร์ว่างของราศีปัจจุบัน (จบที่เวลาย้ายราศี) */
  voc: { start: number; end: number } | null
}

const PHASE_KEYS = ['new', 'waxing_crescent', 'first_quarter', 'waxing_gibbous', 'full', 'waning_gibbous', 'last_quarter', 'waning_crescent']

export function moonInfo(swe: Swe, jd: number): MoonInfo {
  const m = lonAt(swe, jd, 'M')
  const s = lonAt(swe, jd, 'S')
  const elong = mod(m - s, 360)
  const illum = (1 - Math.cos((elong * Math.PI) / 180)) / 2
  const tithi = Math.floor(elong / 12) // 0–29
  const waxing = tithi < 15
  const kham = (tithi % 15) + 1
  // 8 ข้าง: จุดหลัก (ดับ/8 ค่ำ/เต็ม/8 ค่ำแรม) ±6° (ราวครึ่งวัน) นอกนั้นเป็นช่วงระหว่าง
  const near = (c: number) => Math.abs(signed(elong - c)) < 6
  const phaseKey = near(0) ? 'new' : near(90) ? 'first_quarter' : near(180) ? 'full' : near(270) ? 'last_quarter'
    : PHASE_KEYS[Math.floor(elong / 90) * 2 + 1]!
  const ingress = nextIngress(swe, jd, 'M', 4)
  const voc = ingress ? vocBefore(swe, jd, ingress.jd) : null
  return { lon: m, elong, illum, waxing, kham, phaseKey, ingress, voc }
}

/** มุมหลักสุดท้ายของดวงจันทร์ก่อนย้ายราศี → ช่วง VOC (ค้นตั้งแต่จันทร์เข้าราศีนี้) */
export function vocBefore(swe: Swe, jdNow: number, jdIngress: number): { start: number; end: number } | null {
  const from = prevIngress(swe, jdNow, 'M', 3) ?? jdNow - 3
  const step = 1 / 24
  let last: number | null = null
  for (const p of VOC_PTS) {
    for (const t of TYPES) {
      const ang = ANGLE_DEG[t]
      // ระยะจันทร์–ดาว เทียบกับ +ang และ −ang
      for (const sgn of ang === 0 || ang === 180 ? [1] : [1, -1]) {
        const f = (x: number) => signed(lonAt(swe, x, 'M') - lonAt(swe, x, p) - sgn * ang)
        let a = from
        let fa = f(a)
        for (let b = Math.min(from + step, jdIngress); a < jdIngress; b = Math.min(b + step, jdIngress)) {
          const fb = f(b)
          // ข้ามศูนย์ (ไม่ใช่กระโดด ±180)
          if (fa <= 0 !== fb <= 0 && Math.abs(fa - fb) < 90) {
            const hit = bisect(f, a, b)
            if (last === null || hit > last) last = hit
          }
          a = b
          fa = fb
          if (b >= jdIngress) break
        }
      }
    }
  }
  return last === null ? null : { start: last, end: jdIngress }
}

// ---------- ศักดิ์ของดาว (ดาว 7 ดวงแบบดั้งเดิม) ----------
export type Dignity = 'dom' | 'exalt' | 'detr' | 'fall'
const DOMICILE: Partial<Record<Pt, number[]>> = { S: [4], M: [3], m: [2, 5], V: [1, 6], a: [0, 7], J: [8, 11], s: [9, 10] }
const EXALT: Partial<Record<Pt, number>> = { S: 0, M: 1, m: 5, V: 11, a: 9, J: 3, s: 6 }
export function dignityOf(p: Pt, sign: number): Dignity | null {
  const dom = DOMICILE[p]
  if (!dom) return null
  if (dom.includes(sign)) return 'dom'
  if (EXALT[p] === sign) return 'exalt'
  if (dom.some((d) => mod(d + 6, 12) === sign)) return 'detr'
  if (mod(EXALT[p]! + 6, 12) === sign) return 'fall'
  return null
}

// ---------- ทรานซิตกับชาร์ตเกิด ----------
export interface Transit {
  t: Pt
  n: Pt
  type: AspectType
  orb: number
  retro: boolean
  /** วันที่มุมจะพ้น orb ที่แสดง (null = เกินช่วงค้น) */
  endsJd: number | null
}
/** orb ทรานซิตที่แสดง: ≤2° (อาทิตย์/จันทร์จร 3°) — docs/04 */
export const transitOrb = (t: Pt) => (t === 'S' || t === 'M' ? 3 : 2)
/** ลำดับความสำคัญ: ดาวช้าก่อน */
const WEIGHT: Partial<Record<Pt, number>> = { P: 0, N: 1, U: 2, s: 3, J: 4, n: 5, a: 6, V: 7, m: 8, S: 9, M: 10 }
const NATAL_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n', 'A', 'C']

function orbOf(lt: number, ln: number, type: AspectType) {
  let d = Math.abs(lt - ln) % 360
  d = Math.min(d, 360 - d)
  return Math.abs(d - ANGLE_DEG[type])
}

export function transitsNow(swe: Swe, jd: number, natal: Chart, withAngles: boolean): Transit[] {
  const out: Transit[] = []
  const now = Object.fromEntries(SKY_PTS.filter((p) => p !== 'n').map((p) => [p, bodyAt(swe, jd, p)])) as Record<Pt, Body>
  for (const t of Object.keys(now) as Pt[]) {
    for (const n of NATAL_PTS) {
      if (!withAngles && (n === 'A' || n === 'C')) continue
      const ln = natal.aspectPos[n].lon
      for (const type of TYPES) {
        const orb = orbOf(now[t].lon, ln, type)
        if (orb <= transitOrb(t)) out.push({ t, n, type, orb, retro: now[t].speed < 0, endsJd: null })
      }
    }
  }
  out.sort((a, b) => WEIGHT[a.t]! - WEIGHT[b.t]! || a.orb - b.orb)
  return out
}

/** เวลาที่ทรานซิตพ้น orb (ค้นทีละช่วงตามความเร็วดาว) */
export function transitEnd(swe: Swe, jd: number, tr: Transit, natal: Chart): number | null {
  const ln = natal.aspectPos[tr.n].lon
  const lim = transitOrb(tr.t)
  const step = tr.t === 'M' ? 1 / 24 : ['S', 'm', 'V', 'a'].includes(tr.t) ? 0.25 : 2
  const max = ['P', 'N', 'U'].includes(tr.t) ? 3 * 365 : 400
  const f = (x: number) => orbOf(lonAt(swe, x, tr.t), ln, tr.type) - lim
  let prev = jd
  for (let x = jd + step; x <= jd + max; x += step) {
    if (f(x) > 0) return bisect(f, prev, x)
    prev = x
  }
  return null
}
