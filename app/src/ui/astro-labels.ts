// ชื่อไทย สัญลักษณ์ และสีที่ใช้แสดงผล — ค่าตามไฟล์ดีไซน์ (Main.dc.html)
import type { Pt } from '../engine/chart.ts'
import type { AspectType } from '../engine/aspects.ts'

/** ต่อท้าย U+FE0E ให้แสดงเป็นตัวอักษร ไม่ใช่อิโมจิ */
export const V = '︎'

const GLYPH: Partial<Record<Pt, string>> = {
  S: '☉', M: '☽', m: '☿', V: '♀', a: '♂', J: '♃', s: '♄', U: '♅', N: '♆', P: '♇', n: '☊', L: '⚸', c: '⚷',
}
export const glyph = (p: Pt) => (p === 'A' ? 'AC' : p === 'C' ? 'MC' : (GLYPH[p] ?? p) + V)

export const PT_TH: Record<Pt, string> = {
  S: 'อาทิตย์', M: 'จันทร์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต',
  n: 'ราหู (จุดโหนดเหนือ)', L: 'ลิลิธ', c: 'ไครอน', F: 'จุดโชคลาภ', X: 'เวอร์เท็กซ์', A: 'ลัคนา', C: 'กลางฟ้า', D: 'เจ็ดเรือน', I: 'ก้นฟ้า',
}
export const PT_EN: Partial<Record<Pt, string>> = {
  S: 'Sun', M: 'Moon', m: 'Mercury', V: 'Venus', a: 'Mars', J: 'Jupiter', s: 'Saturn', U: 'Uranus', N: 'Neptune', P: 'Pluto',
}

export const SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => g + V)
export const SIGN_TH = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน']
export const SIGN_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

/** สีธาตุ: ไฟ ดิน ลม น้ำ (index ราศี % 4) */
export const ELEMENT_COLOR = ['#FF7A59', '#8FD47A', '#F3D46E', '#6FB2FF']
export const ELEMENT_LIGHT = ['#FFB09A', '#C3EBB5', '#F8E7A8', '#B5D6FF']
export const ELEMENT_TH = ['ไฟ', 'ดิน', 'ลม', 'น้ำ']
export const ELEMENT_EN = ['Fire', 'Earth', 'Air', 'Water']
export const MODALITY_TH = ['เริ่มต้น', 'มั่นคง', 'ปรับตัว']
export const MODALITY_EN = ['Cardinal', 'Fixed', 'Mutable']

export const ASPECT_GLYPH: Record<AspectType, string> = { '0': '☌' + V, '6': '⚹' + V, '4': '□' + V, '3': '△' + V, '8': '☍' + V }
/** สีเส้นมุมในวงชาร์ต */
export const ASPECT_COLOR: Record<AspectType, string> = { '0': '#F3D46E', '6': '#7FB8FF', '4': '#FF8A4C', '3': '#4FD1A5', '8': '#FF6B6B' }

const MONTH_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
/** 5 ส.ค. 2542 */
export const thaiDate = (y: number, mo: number, d: number) => `${d} ${MONTH_TH[mo - 1]} ${y + 543}`
export const hhmm = (h: number, m: number) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

/** แยกองศาในราศี: { deg, min } (floor ลิปดา) */
export function degMin(lon: number) {
  const t = Math.floor((((lon % 30) + 30) % 30) * 60 + 1e-9)
  return { deg: Math.floor(t / 60), min: t % 60 }
}
/** 12°41′ */
export const fmtDeg = (lon: number) => {
  const { deg, min } = degMin(lon)
  return `${deg}°${String(min).padStart(2, '0')}′`
}
/** 13°7′N 99°57′E */
export const fmtLatLon = (latDeg: number, latMin: number, lonDeg: number, lonMin: number) => `${latDeg}°${latMin}′N ${lonDeg}°${lonMin}′E`
/** หัวข้อสั้นของเรือน 1–12 (design/Transit, Lunations, LunarReturn) */
export const HOUSE_TOPIC = ['', 'ตัวตน ภาพลักษณ์', 'เงิน คุณค่าในตัวเอง', 'การสื่อสาร คนใกล้ตัว', 'บ้าน ครอบครัว', 'ความรัก ความสนุก', 'งานประจำวัน สุขภาพ', 'คู่ครอง หุ้นส่วน', 'ความลึกซึ้ง เงินร่วม', 'การเรียน การเดินทาง', 'งาน ชื่อเสียง', 'เพื่อน สังคม ความฝัน', 'จิตใต้สำนึก การพัก']
