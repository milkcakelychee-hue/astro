// รูปแบบชาร์ต (Chart Shape) ตามนิยามของ astro-seek (horoscopes.astro-seek.com/astrology-horoscope-chart-shapes)
// ใช้ดาว 10 ดวง (อาทิตย์–พลูโต) · องศาในนิยามเป็นค่าประมาณ → เผื่อ 15° ตามที่ astro-seek ระบุไว้กับแบบชาม (±15°)
export type Shape = 'bundle' | 'bowl' | 'bucket' | 'locomotive' | 'seesaw' | 'splash'
const TOL = 15
/** ช่วงที่ดาวกินพื้นที่ = 360 − ช่องว่างกว้างสุด */
function span(lons: number[]) {
  const s = [...lons].sort((a, b) => a - b)
  let g = 0
  for (let i = 0; i < s.length; i++) g = Math.max(g, (s[(i + 1) % s.length]! - s[i]! + 360) % 360 || 360)
  return 360 - g
}
function gaps(lons: number[]) {
  const s = [...lons].sort((a, b) => a - b)
  return s.map((x, i) => (s[(i + 1) % s.length]! - x + 360) % 360)
}
export function chartShape(lons: number[]): Shape {
  const sp = span(lons)
  if (sp <= 120 + TOL) return 'bundle'
  if (sp <= 180 + TOL) return 'bowl'
  // ถัง: ตัดดาวหนึ่งดวง (หูหิ้ว) แล้วที่เหลืออยู่ครึ่งวง
  if (lons.some((_, i) => span(lons.filter((__, j) => j !== i)) <= 180 + TOL)) return 'bucket'
  // ไม้กระดก (ตรวจก่อนหัวรถจักร — หัวรถจักรต้อง "เรียงสม่ำเสมอ" ไม่แยกเป็นสองกลุ่ม): สองกลุ่ม = ช่องว่าง ≥ 60° พอดีสองช่อง
  if (gaps(lons).filter((g) => g >= 60).length === 2) return 'seesaw'
  if (sp <= 240 + TOL) return 'locomotive'
  return 'splash'
}
