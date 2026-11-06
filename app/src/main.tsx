import { render } from 'preact'
import './fonts.ts'
import './index.css'
import { App } from './app.tsx'
import { installLight } from './ui/light.ts'
import { getThemePref, isLightTheme } from './ui/theme.ts'
import { installLineBreakRules } from './ui/linebreak.ts'

// ธีมสว่าง: ติดตั้งก่อน render ครั้งแรก · เปลี่ยนธีม = โหลดหน้าใหม่
if (isLightTheme()) installLight()
if (getThemePref() === 'system' && typeof matchMedia === 'function') matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => location.reload())
render(<App />, document.getElementById('app')!)
installLineBreakRules()

// ผู้ใช้ขอ: ห้ามซูม — Safari บน iPhone ไม่สนใจ user-scalable=no เสมอ จึงกันท่าทางหนีบ (pinch) ด้วย
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })

// อัปเดตแอปเอง: ดู src/update.ts
if (import.meta.env.PROD) import('./update.ts')
