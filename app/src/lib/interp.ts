// คลังข้อความอธิบาย lib/interp_lib_th.json + ฟังก์ชันสร้างคีย์ตาม docs/03
// ข้อความอธิบายทุกจุดต้องผ่านไฟล์นี้ ห้ามเขียนข้อความตีความในโค้ด UI
import type { Pt } from '../engine/chart.ts'
import type { AspectType } from '../engine/aspects.ts'

export type Category =
  | 'planet_sign' | 'planet_house' | 'aspect' | 'transit' | 'transit_house' | 'synastry' | 'eclipse'
  | 'moon' | 'retrograde' | 'return' | 'direction' | 'cycle' | 'numerology' | 'electional'
export type InterpLib = Record<Category, Record<string, string>>

let libP: Promise<InterpLib> | null = null
/** โหลดคลังแบบ lazy (แยก chunk ~2.7 MB, service worker จะ cache ไว้ใช้ออฟไลน์) */
export function loadLib(): Promise<InterpLib> {
  libP ??= import('../../../lib/interp_lib_th.json').then((m) => m.default as unknown as InterpLib)
  return libP
}

/** ลำดับดาวในคีย์ของคลัง */
export const LIB_ORDER: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n', 'L', 'c', 'A', 'C']
/** รหัสมุมของ engine → รหัสมุมของคลัง */
export const ASPECT_CODE: Record<AspectType, string> = { '0': 'c', '6': 'x', '4': 'q', '3': 't', '8': 'o' }

const rank = (p: Pt) => {
  const i = LIB_ORDER.indexOf(p)
  return i < 0 ? 99 : i
}

/** มุมในดวงกำเนิด: เรียงคู่ตามลำดับดาว เช่น (a,S,ฉาก) → `Sqa` */
export function aspectKey(a: Pt, b: Pt, t: AspectType): string {
  const [x, y] = rank(a) <= rank(b) ? [a, b] : [b, a]
  return x + ASPECT_CODE[t] + y
}
/** ทรานซิต / synastry / direction: ลำดับคงที่ (ดาวจร/ดาวของ A/ดาวที่เคลื่อน ก่อน) */
export const transitKey = (moving: Pt, t: AspectType, natal: Pt) => moving + ASPECT_CODE[t] + natal
export const synastryKey = (pA: Pt, t: AspectType, pB: Pt) => pA + ASPECT_CODE[t] + pB
export const directionKey = (kind: 'pr' | 'sa' | 'pd', moving: Pt, t: AspectType, natal: Pt) =>
  kind + moving + ASPECT_CODE[t] + natal
export const signKey = (p: Pt, sign: number) => `${p}${sign}`
export const houseKey = (p: Pt, house: number) => `${p}${house}`

/** ดึงข้อความ; ไม่มีคีย์ → null (UI ต้องซ่อนส่วนนั้น ห้ามแต่งข้อความเอง) */
export function text(lib: InterpLib, cat: Category, key: string): string | null {
  return lib[cat]?.[key] ?? null
}

/** แยก "หัวเรื่อง (English): เนื้อหา" → { title, body } สำหรับแสดงผล */
export function splitTitle(s: string): { title: string; body: string } {
  const i = s.indexOf(': ')
  return i < 0 ? { title: '', body: s } : { title: s.slice(0, i), body: s.slice(i + 2) }
}
