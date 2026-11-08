// ธีมสว่างทั้งแอป (new-screens/LightTheme.dc.html): "ไม่ต้องมีไฟล์แยกทุกหน้า ให้สลับค่าสีตามตาราง"
// วิธี: ทุกสีในสไตล์ inline (vnode) และใน CSS ถูกแปลงตอนแสดงผล · แถบแท็บล่างคงสีดำ (ข้ามด้วย keepDark)
import { options } from 'preact'
import { LIGHT_MAP } from './theme.ts'

// ตาราง LightTheme (เพิ่มจาก LIGHT_MAP ของ ChartLight)
const MAP: Record<string, string> = {
  ...LIGHT_MAP,
  '#9FEAC0': '#12866A', '#7FE3C0': '#12866A', '#7FE0A7': '#12866A', '#FFB08A': '#C9570F', '#FF9A9A': '#D92D2D', '#FFD27A': '#9A7000',
  '#FF9EC7': '#B8326E', '#FF8FB1': '#B8326E', '#151827': '#FFFFFF', '#0C0E18': '#F3F4F8', '#15161D': '#F3F4F8', '#1D2135': '#FFFFFF',
  '#FFC46B': '#9A6400', '#5BD1FF': '#0B7FA8', '#C98BFF': '#7A34C8', '#D6B87A': '#7D6420', '#FFD0BA': '#9A3F0A', '#D6DEFF': '#12131A',
}
const RE = /#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g

const hex2 = (h: string) => { if (h.length === 4) h = '#' + [...h.slice(1)].map((x) => x + x).join(''); return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number] }
const lum = ([r, g, b]: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!) }
/** สีอ่อน (ใช้บนพื้นมืด) → สีเข้มโทนเดียวกัน ให้อ่านได้บนพื้นสว่าง (≥4.5:1) */
function darken([r, g, b]: number[]): string {
  const mx = Math.max(r!, g!, b!) / 255, mn = Math.min(r!, g!, b!) / 255, l = (mx + mn) / 2, d = mx - mn
  let h = 0
  if (d) { const R = r! / 255, G = g! / 255, B = b! / 255; h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h *= 60; if (h < 0) h += 360 }
  const s = d ? Math.min(0.85, d / (1 - Math.abs(2 * l - 1))) : 0, L = 0.3
  const C = (1 - Math.abs(2 * L - 1)) * s, X = C * (1 - Math.abs(((h / 60) % 2) - 1)), m = L - C / 2
  const [a, b2, c] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X]
  return '#' + [a, b2, c].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()
}

/** แปลงค่าสีหนึ่งค่า · fg = เป็นสีตัวอักษร/เส้น (ไม่ใช่พื้น) */
function conv(m: string, fg: boolean): string {
  const k = m.replace(/\s+/g, '')
  if (k[0] === '#') {
    const u = k.toUpperCase(), hit = MAP[u]
    if (hit) return hit
    const rgb = hex2(u), L = lum(rgb)
    if (fg) return L > 0.35 ? darken(rgb) : m
    return L < 0.06 ? '#FFFFFF' : m
  }
  const p = /^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/.exec(k)
  if (!p) return m
  const hit = MAP[k]
  if (hit) return hit
  const rgb = [+p[1]!, +p[2]!, +p[3]!], a = p[4] === undefined ? 1 : +p[4]
  if (rgb[0] === 255 && rgb[1] === 255 && rgb[2] === 255) return `rgba(18,19,26,${a})` // ขาวโปร่ง → เส้น/พื้นเข้มจาง
  const L = lum(rgb)
  if (L < 0.06) return fg ? `rgba(18,19,26,${a})` : `rgba(255,255,255,${Math.max(a, 0.7)})` // พื้นดำโปร่ง → การ์ดขาว
  if (fg && L > 0.35) return darken(rgb).replace('#', '') && `rgba(${hex2(darken(rgb)).join(',')},${a})`
  return m
}
const FG = /^(color|fill|stroke|border|borderTop|borderBottom|borderLeft|borderRight|borderColor|outline|boxShadow|textDecorationColor|caretColor|stop-color|stopColor|-webkit-text-fill-color)$/i
export function convValue(prop: string, v: string): string {
  const fg = FG.test(prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase()))
  // พื้นหลังหน้า: #06070D ท้าย gradient → #F3F4F8 (LightTheme: พื้นหลังหน้า)
  if (!fg && /gradient/.test(v) && /#06070D\s*$/i.test(v)) v = v.replace(/#06070D\s*$/i, '#F3F4F8')
  return v.replace(RE, (m) => conv(m, fg))
}

let keep = 0
/** ส่วนที่คงสีมืดทั้งสองธีม (แถบแท็บล่าง) */
export const keepDark = (on: boolean) => { keep += on ? 1 : -1 }

let on = false
export const lightOn = () => on
export function installLight() {
  on = true
  document.documentElement.classList.add('light')
  const prev = options.vnode
  options.vnode = (vn) => {
    if (keep <= 0 && typeof vn.type === 'string' && !(vn.props as Record<string, unknown>)['data-moon']) {
      const p = vn.props as Record<string, unknown>
      const st = p.style
      if (st && typeof st === 'object') { const o: Record<string, unknown> = {}; for (const [k, v] of Object.entries(st)) o[k] = typeof v === 'string' ? convValue(k, v) : v; p.style = o }
      else if (typeof st === 'string') p.style = st.replace(/([\w-]+)\s*:\s*([^;]+)/g, (_, k: string, v: string) => `${k}:${convValue(k, v)}`)
      for (const a of ['fill', 'stroke', 'stop-color', 'stopColor', 'color']) if (typeof p[a] === 'string') p[a] = convValue(a === 'color' ? 'color' : 'stroke', p[a] as string)
    }
    prev?.(vn)
  }
  // CSS: สร้างกฎ html.light ซ้อนทับทุกไฟล์ (รวมไฟล์ที่โหลดทีหลัง)
  const out = document.createElement('style')
  out.id = 'light-css'
  document.head.appendChild(out)
  const done = new WeakSet<CSSStyleSheet>()
  const scan = () => {
    let css = ''
    for (const sh of [...document.styleSheets]) {
      if (sh.ownerNode === out || done.has(sh)) continue
      let rules: CSSRuleList
      try { rules = sh.cssRules } catch { continue }
      done.add(sh)
      for (const r of [...rules]) {
        if (!(r instanceof CSSStyleRule) || /\.tab\b|\.light\b|\.pg-main\b/.test(r.selectorText)) continue
        const decl: string[] = []
        for (const prop of [...r.style]) {
          const v = r.style.getPropertyValue(prop)
          if (!RE.test(v)) { RE.lastIndex = 0; continue }
          RE.lastIndex = 0
          decl.push(`${prop}:${prop.startsWith('--') ? convVar(prop, v) : convValue(prop, v)}`)
        }
        if (decl.length) css += `${r.selectorText.split(',').map((s) => (s.trim() === ':root' ? 'html.light' : 'html.light ' + s.trim())).join(',')}{${decl.join(';')}}\n`
      }
    }
    if (css) out.textContent += css
  }
  scan()
  new MutationObserver(scan).observe(document.head, { childList: true, subtree: true })
}
/** ตัวแปรสี: ตามบทบาทในตาราง LightTheme */
function convVar(name: string, v: string) {
  const fixed: Record<string, string> = { '--bg': '#F3F4F8', '--card': 'rgba(255,255,255,.78)', '--card-border': 'rgba(18,19,26,.10)', '--tab-idle': '#4A4E5C' }
  if (fixed[name]) return fixed[name]!
  return convValue('color', v)
}
