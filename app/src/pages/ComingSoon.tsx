// หน้า "จะมาเร็ว ๆ นี้" — ตาม new-screens/ComingSoon.dc.html · ใช้กับทุกฟีเจอร์ที่ยังไม่พร้อม
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 200px,rgba(31,165,135,.38),transparent 70%),#06070D'
const NAMES: Record<string, string> = {
  growth: 'ตัวตนฉันเติบโตไปทางไหน', retrograde: 'ช่วงดาวถอยหลัง และช่วงเงาดาวพุธ', 'moon-phases': 'ปฏิทินดวงจันทร์ และช่วงจันทร์ว่าง',
  eclipses: 'สุริยุปราคา / จันทรุปราคา', 'venus-rose': 'รอบดาวศุกร์', cycles: 'รอบโคจรของดาวเคราะห์', ephemeris: 'ตารางตำแหน่งดาวรายวัน',
  electional: 'หาวันดีสำหรับเริ่มสิ่งใหม่', numerology: 'เลขศาสตร์', symbols: 'ความหมายสัญลักษณ์',
}

export function ComingSoon(props: { route: string }) {
  const back = () => (history.length > 1 ? history.back() : (location.hash = '#/forecast'))
  return (
    <Page background={BG}>
      <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
        <a href="#/forecast" onClick={(e) => { e.preventDefault(); back() }} style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none', color: '#7FB8FF' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ย้อนกลับ
        </a>
      </div>
      <div style={{ padding: '30px 24px 140px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
        <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="76" fill="rgba(138,92,255,.12)" /><circle cx="80" cy="80" r="56" fill="none" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 7" /><path d="M80 40l6 16 17 2-13 11 4 17-14-9-14 9 4-17-13-11 17-2z" fill="none" stroke="#B9A6FF" stroke-width="2.5" stroke-linejoin="round" /><circle cx="128" cy="52" r="5" fill="#7FE3C0" /><circle cx="34" cy="112" r="4" fill="#FFD27A" /></svg>
        <span style={{ height: '24px', padding: '0 9px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', fontSize: '12px', fontWeight: 600, background: 'rgba(185,166,255,.16)', color: '#D6CEFF' }}>เร็ว ๆ นี้</span>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, lineHeight: 1.35 }}>{NAMES[props.route] ?? 'ฟีเจอร์นี้'}</h1>
        <span style={{ fontSize: '14px', lineHeight: 1.7, color: '#C9CEDC', maxWidth: '300px' }}>กำลังทำอยู่ เมื่อพร้อมแล้วจะเปิดให้ใช้ในหน้านี้ทันที ไม่ต้องอัปเดตอะไรเพิ่ม</span>
        <div style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', borderRadius: '22px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>ระหว่างนี้ลองดู</span>
          <a href="#/transit" style={{ fontSize: '14px', color: '#7FB8FF' }}>ดาวตอนนี้กระทบชาร์ต →</a>
          <a href="#/calendar" style={{ fontSize: '14px', color: '#7FB8FF' }}>ปฏิทินดวงส่วนตัว →</a>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
