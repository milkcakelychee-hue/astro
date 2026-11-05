import { render } from 'preact'
import './fonts.ts'
import './index.css'
import { App } from './app.tsx'

render(<App />, document.getElementById('app')!)

// ผู้ใช้ขอ: ห้ามซูม — Safari บน iPhone ไม่สนใจ user-scalable=no เสมอ จึงกันท่าทางหนีบ (pinch) ด้วย
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })
