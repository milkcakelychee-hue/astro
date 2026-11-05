// [ข้อเสนอ — รอผู้ใช้อนุมัติ] หน้าว่างเมื่อยังไม่มีชาร์ตของฉัน · ใช้ชิ้นส่วนจากระบบดีไซน์เดิมเท่านั้น
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'

export function MainEmpty(props: { background: string; onLoaded: () => void }) {
  return (
    <Page background={props.background}>
      <div style={{ padding: '62px 20px 150px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>ชาร์ตของฉัน</h1>
        <div class="card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', borderRadius: '20px' }}>
          <span style={{ width: '56px', height: '56px', borderRadius: '999px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B9A6FF' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v5M12 16v5M3 12h5M16 12h5" /></svg>
          </span>
          <span style={{ fontSize: '17px', fontWeight: 600 }}>ยังไม่มีชาร์ตของคุณ</span>
          <span style={{ fontSize: '13.5px', lineHeight: '1.6', color: '#C9CEDC' }}>ใส่วันเกิด เวลาเกิด และจังหวัดที่เกิด เพื่อสร้างชาร์ตกำเนิด ข้อมูลเก็บในเครื่องนี้เท่านั้น</span>
          <a href="#/add?me=1" style={{ height: '42px', padding: '0 18px', borderRadius: '12px', background: '#F2F4FA', color: '#06070D', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 600, textDecoration: 'none', marginTop: '4px' }}>เพิ่มข้อมูลเกิดของฉัน</a>
        </div>
        {import.meta.env.DEV && (
          <button onClick={() => import('../data/dev-sample.ts').then((m) => m.loadDevSample()).then(props.onLoaded)} style={{ alignSelf: 'center', border: '1px dashed #FFB08A', background: 'transparent', color: '#FFB08A', borderRadius: '10px', padding: '8px 12px', font: '500 12px var(--font)' }}>
            [dev] โหลดชาร์ตตัวอย่าง docs/02
          </button>
        )}
      </div>
      <TabBar active="main" />
    </Page>
  )
}
