import { keepDark, lightOn } from './light.ts'
// แท็บหลัก 5 ช่อง — ตามดีไซน์ (โหมดมืด) · ตำแหน่งยึดกับขอบจอ (fixed) แทน absolute ของไฟล์ดีไซน์
export type TabId = 'main' | 'people' | 'today' | 'forecast' | 'settings'

const ICON = {
  main: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v5M12 16v5M3 12h5M16 12h5" /></svg>,
  people: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2a5 5 0 0 1 6 4.8" /></svg>,
  forecast: (w: number) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={w} aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" /></svg>,
  settings: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>,
}

export function TabBar(props: { active?: TabId }) {
  // แถบแท็บล่างคงสีดำทั้งสองธีม (LightTheme)
  keepDark(true)
  try {
    return tabBar(props)
  } finally {
    keepDark(false)
  }
}
// ผู้ใช้ขอ (6 พ.ย. 2569): โหมดสว่างให้แถบเมนูสว่างตามด้วย (แทนกฎ "คงสีดำ" ในดีไซน์ LightTheme)
const DARK = { bg: 'linear-gradient(180deg,#1C1D24,#000000)', shadow: '0 -8px 30px rgba(0,0,0,.30)', line: 'rgba(255,255,255,.10)', on: '#B9A6FF', off: '#C9CEDC', ring: '#0A0B10', btn: 'radial-gradient(circle at 40% 30%,#3A3B44,#1A1B21)', btnLine: 'transparent', icon: '#B9A6FF' }
const LIGHT = { bg: 'linear-gradient(180deg,#FFFFFF,#ECEEF4)', shadow: '0 -8px 30px rgba(18,19,26,.08)', line: 'rgba(18,19,26,.10)', on: '#5B3FD0', off: '#5A6070', ring: '#F3F4F8', btn: 'radial-gradient(circle at 40% 30%,#FFFFFF,#E4E6EE)', btnLine: 'rgba(18,19,26,.10)', icon: '#5B3FD0' }
function tabBar(props: { active?: TabId }) {
  const T = lightOn() ? LIGHT : DARK
  const st = (id: TabId) => (props.active === id ? { color: T.on, fontWeight: 700 } : { color: T.off })
  const cur = (id: TabId) => (props.active === id ? 'page' : undefined)
  return (
    <nav
      aria-label="แท็บหลัก"
      style={{
        position: 'fixed', left: '0px', right: '0px', bottom: '0px', maxWidth: '390px', margin: '0 auto', zIndex: 10,
        // ดีไซน์: สูง 91 = 65 + เว้นล่าง 26 · บน iPhone ใช้ระยะ home indicator จริงถ้ามากกว่า 26
        height: 'calc(65px + max(26px, env(safe-area-inset-bottom)))',
        padding: '0 6px max(26px, env(safe-area-inset-bottom))',
        boxSizing: 'border-box', borderRadius: '32px 32px 0 0', background: T.bg,
        boxShadow: T.shadow, display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', alignItems: 'end',
        borderTop: `1px solid ${T.line}`,
        // แยกเลเยอร์ให้ GPU — แถบไม่สั่นตอนหน้าเปลี่ยนความสูง (กาง/พับ)
        transform: 'translateZ(0)', willChange: 'transform',
      }}
    >
      <a href="#/main" class="tab" style={st('main')} aria-current={cur('main')}>{ICON.main}ชาร์ตของฉัน</a>
      <a href="#/people" class="tab" style={st('people')} aria-current={cur('people')}>{ICON.people}บุคคล</a>
      <a href="#/today" class="tab" style={{ position: 'relative', ...st('today'), fontWeight: props.active === 'today' ? 700 : 500 }} aria-current={cur('today')}>
        <span style={{ position: 'absolute', top: '-44px', left: '50%', marginLeft: '-44px', width: '88px', height: '88px', borderRadius: '999px', background: T.ring, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: '72px', height: '72px', borderRadius: '999px', background: T.btn, border: `1px solid ${T.btnLine}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.icon }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          </span>
        </span>
        วันนี้
      </a>
      <a href="#/forecast" class="tab" style={st('forecast')} aria-current={cur('forecast')}>{ICON.forecast(props.active === 'forecast' ? 1.9 : 1.6)}ดวงล่วงหน้า</a>
      <a href="#/settings" class="tab" style={st('settings')} aria-current={cur('settings')}>{ICON.settings}ตั้งค่า</a>
    </nav>
  )
}
