// หน้าว่างเมื่อยังไม่มีชาร์ตของฉัน — ตาม new-screens/MainEmpty.dc.html
import { useRef, useState } from 'preact/hooks'
import { importBackup } from '../data/people.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 200px,rgba(31,165,135,.38),transparent 70%),#06070D'
const btn = { height: '52px', border: 'none', borderRadius: '16px', font: '600 16px var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }
const STEPS: [string, string, string, string][] = [
  ['rgba(185,166,255,.16)', '#B9A6FF', 'วงชาร์ตและ 3 ตำแหน่งหลัก', 'อาทิตย์ จันทร์ ลัคนา พร้อมคำอธิบายภาษาไทย'],
  ['rgba(127,227,192,.16)', '#7FE3C0', 'ดาวตอนนี้กระทบคุณอย่างไร', 'หน้าวันนี้และดวงล่วงหน้าคิดจากชาร์ตนี้'],
  ['rgba(127,184,255,.16)', '#7FB8FF', 'เปรียบเทียบกับคนอื่น', 'เพิ่มเพื่อน ครอบครัว หรือคนรักได้ภายหลัง'],
]

export function MainEmpty(props: { background?: string; onLoaded: () => void }) {
  const file = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState('')
  const onFile = async (f: File | undefined) => {
    if (!f) return
    try {
      const n = await importBackup(await f.text())
      if (n) props.onLoaded()
      else setErr('ไม่พบข้อมูลคนในไฟล์นี้')
    } catch { setErr('อ่านไฟล์ไม่ได้ ต้องเป็นไฟล์สำรอง .json ของแอปนี้') }
  }
  return (
    <Page background={BG}>
      <div style={{ padding: '62px 20px 140px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>ชาร์ตของฉัน</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '28px 20px 24px', borderRadius: '28px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)', textAlign: 'center' }}>
          <svg width="200" height="200" viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="eg"><stop offset="0" stop-color="#8A5CFF" stop-opacity=".45" /><stop offset="1" stop-color="#8A5CFF" stop-opacity="0" /></radialGradient></defs><circle cx="100" cy="100" r="96" fill="url(#eg)" /><circle cx="100" cy="100" r="78" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.5" /><circle cx="100" cy="100" r="54" fill="none" stroke="rgba(255,255,255,.18)" stroke-dasharray="3 6" /><ellipse cx="100" cy="100" rx="92" ry="30" transform="rotate(-20 100 100)" fill="none" stroke="#7FE3C0" stroke-opacity=".5" stroke-dasharray="2 8" stroke-linecap="round" /><circle cx="100" cy="100" r="14" fill="#F2F4FA" /><circle cx="100" cy="100" r="26" fill="#F2F4FA" opacity=".15" /><circle cx="168" cy="72" r="6" fill="#7FE3C0" /><circle cx="40" cy="130" r="5" fill="#B9A6FF" /><circle cx="130" cy="30" r="3" fill="#fff" /><circle cx="60" cy="40" r="2.5" fill="#fff" opacity=".7" /></svg>
          <span style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.4 }}>เริ่มจากชาร์ตของคุณเอง</span>
          <span style={{ fontSize: '14px', lineHeight: 1.7, color: '#C9CEDC' }}>ใส่วัน เวลา และจังหวัดที่เกิด แอปจะคำนวณตำแหน่งดาวตอนคุณเกิด และใช้เป็นฐานของทุกหน้า ทั้งวันนี้และดูดวงล่วงหน้า</span>
          <a href="#/add?me=1" style={{ ...btn, background: 'linear-gradient(135deg,#8A5CFF,#3B6BFF 55%,#1FA587)', color: '#fff', textDecoration: 'none' }}>ใส่ข้อมูลเกิดของฉัน</a>
          <span class="lbl" style={{ fontSize: '12px', color: '#9AA1B5' }}>ใช้เวลาไม่ถึง 1 นาที · ข้อมูลเก็บในเครื่องนี้เท่านั้น</span>
        </div>
        <div style={{ padding: '6px 16px', borderRadius: '22px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}>
          {STEPS.map(([bg, c, t, s], i) => (
            <div style={{ padding: '12px 0', display: 'flex', gap: '12px', borderTop: i ? '1px solid rgba(255,255,255,.07)' : undefined }}>
              <span style={{ flex: 'none', width: '32px', height: '32px', borderRadius: '10px', background: bg, color: c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{i + 1}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><b style={{ fontSize: '14px' }}>{t}</b><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{s}</span></span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', fontSize: '13px', lineHeight: 1.6, color: '#C9CEDC' }}><span style={{ flex: 'none' }}>ไม่รู้เวลาเกิด?</span><span>ใส่ได้ แอปจะซ่อนลัคนาและเรือน แล้วคำนวณดาวที่เวลา 12:00 น.</span></div>
        <button onClick={() => file.current?.click()} style={{ ...btn, background: 'transparent', border: '1px solid rgba(255,255,255,.14)', color: '#C9CEDC', height: '48px' }}>มีไฟล์สำรองอยู่แล้ว · นำเข้าข้อมูล</button>
        <input ref={file} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={(e) => onFile(e.currentTarget.files?.[0])} />
        {err && <span style={{ fontSize: '13px', color: '#FFB08A', textAlign: 'center' }}>{err}</span>}
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
