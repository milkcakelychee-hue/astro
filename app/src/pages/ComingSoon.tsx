// หน้าที่ยังไม่ได้ทำ (ผู้ใช้ขอ): บอกว่าจะมาเร็ว ๆ นี้ แทนการเด้งกลับหน้าหลัก
import { Page } from '../ui/components.tsx'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(59,107,255,.40),transparent 70%),radial-gradient(460px 380px at -10% 360px,rgba(138,92,255,.28),transparent 70%),#06070D'

export function ComingSoon() {
  const back = () => (history.length > 1 ? history.back() : (location.hash = '#/forecast'))
  return (
    <Page background={BG}>
      <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
        <button onClick={back} style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', color: '#7FB8FF', background: 'none', border: 'none', font: 'inherit' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
          ย้อนกลับ
        </button>
      </div>
      <div style={{ padding: '120px 32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
        <span style={{ width: '72px', height: '72px', borderRadius: '999px', background: 'rgba(138,92,255,.18)', border: '1px solid rgba(170,160,255,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🔭</span>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600 }}>จะมาเร็ว ๆ นี้</h1>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#C9CEDC' }}>หน้านี้กำลังสร้างอยู่ เปิดใช้ได้ในเวอร์ชันถัดไป</p>
      </div>
    </Page>
  )
}
