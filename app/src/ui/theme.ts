// ธีม: ตามเครื่อง / สว่าง / มืด (docs/04) — โทนสว่างใช้เฉพาะหน้าชาร์ต ตาม design/ChartLight.dc.html
export type ThemePref = 'system' | 'light' | 'dark'

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem('theme')
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ไม่มี storage → ค่าเริ่มต้น */
  }
  return 'system'
}
export function setThemePref(v: ThemePref) {
  try {
    localStorage.setItem('theme', v)
  } catch {
    /* ignore */
  }
}
export function isLightTheme(): boolean {
  const p = getThemePref()
  if (p !== 'system') return p === 'light'
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches
}

/** สีโทนมืด → โทนสว่าง (จับคู่จาก Main.dc.html กับ ChartLight.dc.html) */
export const LIGHT_MAP: Record<string, string> = {
  '#7FB8FF': '#2F5BEA', '#B5D6FF': '#1C3FB0', '#9AA1B5': '#5A6070', '#C9CEDC': '#3A4050', '#F2F4FA': '#12131A',
  '#06070D': '#FFFFFF', '#0C0E18': '#FFFFFF', '#E4DCFF': '#5B3FD0', '#D6CEFF': '#5B3FD0', '#B9A6FF': '#5B3FD0', '#B8BFD3': '#4A5060',
  '#DCE0EA': '#23262F', '#FF8A4C': '#C9570F', '#FF7A59': '#D9481F', '#FFB09A': '#F2A189', '#8FD47A': '#2F8F3A',
  '#C3EBB5': '#9ED593', '#F3D46E': '#9A7000', '#F8E7A8': '#E3C766', '#6FB2FF': '#1F6FD6', '#6FE0C0': '#12866A',
  '#FFB39F': '#B23A16', '#B9E6AC': '#246F2D', '#4FD1A5': '#12866A', '#FF6B6B': '#D92D2D', '#D6DEFF': '#3A4050',
  '#E6E9F2': '#23262F', '#DCE3F5': '#3A4050',
  'rgba(255,255,255,.05)': 'rgba(255,255,255,.78)', 'rgba(6,7,13,.45)': 'rgba(255,255,255,.7)', 'rgba(6,7,13,.5)': 'rgba(255,255,255,.7)',
  'rgba(185,166,255,.16)': 'rgba(107,79,224,.16)', 'rgba(200,210,255,.35)': 'rgba(18,19,26,.22)', 'rgba(200,210,255,.16)': 'rgba(18,19,26,.10)',
  'rgba(12,14,24,.55)': 'rgba(255,255,255,.85)',
}
const RE = /#[0-9A-Fa-f]{6}\b|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g
export function toLight(s: string): string {
  return s.replace(RE, (m) => {
    const k = m.replace(/\s+/g, '')
    const hit = LIGHT_MAP[k.toUpperCase().startsWith('#') ? k.toUpperCase() : k]
    if (hit) return hit
    const w = /^rgba\(255,255,255,([\d.]+)\)$/.exec(k)
    return w ? `rgba(18,19,26,${w[1]})` : m
  })
}

let light = false
/** หน้าที่รองรับโทนสว่างเรียกก่อน render */
export function setRenderLight(v: boolean) {
  light = v
}
/** สีตามธีมปัจจุบัน */
export const c = (s: string) => (light ? toLight(s) : s)
