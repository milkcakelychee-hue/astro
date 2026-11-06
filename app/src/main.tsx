import { render } from 'preact'
import './fonts.ts'
import './index.css'
import { App } from './app.tsx'
import { installLineBreakRules } from './ui/linebreak.ts'

render(<App />, document.getElementById('app')!)
installLineBreakRules()

// ผู้ใช้ขอ: ห้ามซูม — Safari บน iPhone ไม่สนใจ user-scalable=no เสมอ จึงกันท่าทางหนีบ (pinch) ด้วย
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })

// ผู้ใช้ขอ: ขึ้นเว็บแล้วแอปบน iPhone อัปเดตเองภายใน 1–2 นาที ไม่ต้องปิดเปิดแอป
// เช็กเวอร์ชันใหม่ทุก 1 นาที และทุกครั้งที่กลับมาเปิดแอป · พบแล้ว service worker ใหม่จะทำงานและโหลดหน้าใหม่เอง (autoUpdate)
if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      immediate: true,
      onRegisteredSW(_url, reg) {
        if (!reg) return
        const check = () => { if (navigator.onLine) reg.update().catch(() => {}) }
        setInterval(check, 60_000)
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
      },
    })
  })
}
