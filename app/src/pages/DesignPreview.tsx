// หน้าตรวจคอมโพเนนต์กลาง — ทำซ้ำส่วน "ชิ้นส่วน" ของ design/DesignSystem.dc.html เพื่อเทียบภาพ (ไม่อยู่ในแอปจริง)
import { useState } from 'preact/hooks'
import { BackLink, Card, Chevron, Chip, LevelBar, Page, PageTitle, PrimaryButton, Seg, Toggle } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'

const BG =
  'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'

export function DesignPreview() {
  const [seg, setSeg] = useState<'3' | '6' | '12'>('3')
  const [sel, setSel] = useState('งาน')
  return (
    <Page background={BG}>
      <BackLink href="#/settings" label="ตั้งค่า" />
      <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {import.meta.env.DEV && (
          // [dev] ลิงก์ไปหน้าที่ทำเสร็จแล้ว — ไม่แสดงในแอปจริง
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', borderRadius: '14px', border: '1px dashed #FFB08A' }}>
            <span style={{ width: '100%', fontSize: '12px', color: '#FFB08A' }}>[dev] หน้าที่ทำแล้ว</span>
            {[['#/main', 'ชาร์ตของฉัน'], ['#/aspects', 'มุมดาวทั้งหมด'], ['#/add', 'เพิ่มคน'], ['#/add?me=1', 'เพิ่มคน (ฉัน)']].map(([h, t]) => (
              <a href={h} style={{ padding: '6px 10px', borderRadius: '10px', background: 'rgba(255,255,255,.07)', fontSize: '13px', textDecoration: 'none' }}>{t}</a>
            ))}
          </div>
        )}
        <PageTitle
          kicker="คู่มือสำหรับสร้างแอป"
          title="ระบบดีไซน์"
          en="(Design system)"
          intro={{ what: 'รวมสี ตัวอักษร ไอคอน และชิ้นส่วนที่ใช้ซ้ำทั้งแอป', use: 'ใช้อ้างอิงตอนออกแบบหรือเขียนโค้ดหน้าใหม่ ให้หน้าตาเหมือนกันทุกหน้า', why: 'ทำให้แอปดูเป็นชุดเดียวกัน และเขียนโค้ดเร็วขึ้น' }}
        />
        <Card title="ชิ้นส่วน" sub="ส่วนประกอบที่ใช้ซ้ำ">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span class="lbl">แท็บสลับ (.seg)</span>
            <Seg value={seg} onChange={setSeg} options={[{ value: '3', label: '3 เดือน' }, { value: '6', label: '6 เดือน' }, { value: '12', label: '1 ปี' }]} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span class="lbl">ปุ่มเลือก (ไม่เลือก / เลือก)</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ความรัก', 'งาน'].map((x) => <Toggle on={sel === x} onClick={() => setSel(x)}>{x}</Toggle>)}
              <PrimaryButton>ปุ่มหลัก</PrimaryButton>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span class="lbl">ป้าย (.chip)</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Chip tone="good">ผลดี</Chip><Chip tone="avoid">ควรเลี่ยง</Chip><Chip tone="warn">แตะชาร์ต</Chip><Chip tone="neutral">กำลังจะมา</Chip>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span class="lbl">แถบระดับ 3 ขีด</span>
            <LevelBar level={2} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span class="lbl">ปุ่ม ? คำอธิบายหน้า และลูกศรแตะดูเพิ่ม</span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>?</span>
              <Chevron open={false} />
              <span class="lbl">ทุกอย่างที่แตะได้ต้องมีสัญลักษณ์บอก</span>
            </div>
          </div>
        </Card>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
