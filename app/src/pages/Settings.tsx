// หน้า "ตั้งค่า" — ตาม design/Settings.dc.html
import { useState } from 'preact/hooks'
import { exportAll, importAll } from '../data/people.ts'
import { setShowPoint, showPoint, type PointToggle } from '../data/settings.ts'
import { getThemePref, setThemePref, type ThemePref } from '../ui/theme.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './settings.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(59,107,255,.40),transparent 70%),radial-gradient(460px 380px at -10% 360px,rgba(138,92,255,.28),transparent 70%),#06070D'
const V = '︎'
const VERSION = __APP_VERSION__

const PTS: [PointToggle, string, string, string][] = [
  ['L', '⚸' + V, 'ลิลิธ', 'จุดดวงจันทร์ดำ · ค่าเฉลี่ย (Mean)'],
  ['c', '⚷' + V, 'ไครอน', 'บาดแผลและการเยียวยา'],
  ['ast', '⚳' + V, 'ดาวเคราะห์น้อย 4 ดวง', 'Ceres, Pallas, Juno, Vesta'],
  ['F', '⊗' + V, 'จุดโชคลาภ', 'Part of Fortune'],
  ['south', '☋' + V, 'เกตุ', 'จุดตรงข้ามราหู'],
  ['X', 'Vx', 'Vertex', 'จุดพบเจอที่ถูกกำหนด'],
]
const chev = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
const ri = (bg: string, fg: string, kids: preact.ComponentChildren, fs?: string) => <span class="ri" style={{ background: bg, color: fg, ...(fs ? { fontSize: fs } : {}) }}>{kids}</span>
const ic = (d: preact.ComponentChildren) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">{d}</svg>
const two = (a: string, b: string) => <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span>{a}</span><span class="lbl">{b}</span></span>

export function Settings() {
  const [on, setOn] = useState(() => Object.fromEntries(PTS.map(([k]) => [k, showPoint(k)])) as Record<PointToggle, boolean>)
  const [th, setTh] = useState<ThemePref>(getThemePref())
  const [msg, setMsg] = useState<string | null>(null)

  const toggle = (k: PointToggle) => { setShowPoint(k, !on[k]); setOn({ ...on, [k]: !on[k] }) }
  const theme = (v: ThemePref) => { setThemePref(v); setTh(v) }
  const backup = async () => {
    const blob = new Blob([await exportAll()], { type: 'application/json' })
    const t = new Date()
    const name = `astro-backup-${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}.json`
    const file = new File([blob], name, { type: 'application/json' })
    // iPhone: เปิดหน้าแชร์ (บันทึกลงไฟล์ได้) · อย่างอื่นดาวน์โหลด
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return } catch { return }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const restore = () => {
    const inp = document.createElement('input')
    inp.type = 'file'
    inp.accept = 'application/json,.json'
    inp.onchange = async () => {
      const f = inp.files?.[0]
      if (!f) return
      try { setMsg(`นำเข้าแล้ว ${await importAll(await f.text())} คน`) } catch (e) { setMsg(e instanceof Error ? e.message : String(e)) }
    }
    inp.click()
  }

  return (
    <Page background={BG}>
      <div class="pg-settings" style={{ padding: '62px 20px 140px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>ตั้งค่า</h1>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 16px', borderRadius: '18px', background: 'linear-gradient(135deg,rgba(79,209,165,.20),rgba(59,107,255,.16))', border: '1px solid rgba(79,209,165,.35)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7FE3C0" stroke-width="1.9" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>ตั้งค่าตรงกับ astro-seek</span>
            <span style={{ fontSize: '12px', color: '#C9CEDC', lineHeight: 1.5 }}>ระบบเรือน ราศี และระยะห่างของมุมดาว (Orb) ใช้ค่าเดียวกับเว็บทุกอย่าง ผลจึงตรงกัน</span>
          </div>
        </div>

        <div class="sec">
          <span class="sh">ระบบการคำนวณ</span>
          <div class="box">
            <button class="row">{ri('rgba(127,184,255,.16)', '#7FB8FF', ic(<path d="M4 11 12 4l8 7v9H4z" />))}{two('ระบบเรือน', 'วิธีแบ่งชาร์ตเป็น 12 เรือน')}<span class="rv">Placidus {chev}</span></button>
            <div class="row">{ri('rgba(185,166,255,.16)', '#B9A6FF', ic(<><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18" /></>))}{two('ระบบการวางราศี', 'ใช้แบบเดียวทั้งแอป')}<span class="rv">แบบสากล (Tropical)</span></div>
            <button class="row">{ri('rgba(243,212,110,.16)', '#F3D46E', '☊' + V, '16px')}{two('ราหู / เกตุ', 'ตำแหน่งจริง หรือค่าเฉลี่ย')}<span class="rv">ค่าเฉลี่ย (Mean) {chev}</span></button>
          </div>
        </div>

        <div class="sec">
          <span class="sh">ดาวและจุดที่แสดงในชาร์ต</span>
          <div class="box">
            {PTS.map(([k, g, n, d]) => (
              <div class="row">
                <span style={{ width: '28px', fontSize: '17px', color: '#DCE0EA' }}>{g}</span>{two(n, d)}
                <button role="switch" aria-checked={on[k]} aria-label={n} onClick={() => toggle(k)} style={{ width: '52px', height: '32px', borderRadius: '999px', border: 'none', padding: '3px', background: on[k] ? '#4FD1A5' : 'rgba(255,255,255,.18)', display: 'flex', justifyContent: on[k] ? 'flex-end' : 'flex-start' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '999px', background: '#FFFFFF' }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div class="sec">
          <span class="sh">การแสดงผล</span>
          <div class="box">
            <div class="row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
              <span>ธีม</span>
              <div role="group" aria-label="ธีม" style={{ display: 'flex', gap: '4px', padding: '3px', borderRadius: '12px', background: 'rgba(255,255,255,.07)' }}>
                {([['system', 'ตามเครื่อง'], ['light', 'สว่าง'], ['dark', 'มืด']] as const).map(([v, t]) => <button class={th === v ? 'seg on' : 'seg'} onClick={() => theme(v)}>{t}</button>)}
              </div>
            </div>
          </div>
        </div>

        <div class="sec">
          <span class="sh">คู่มือ</span>
          <div class="box">
            <a href="#/symbols" class="row" style={{ textDecoration: 'none' }}>{ri('rgba(243,212,110,.16)', '#F3D46E', '♀' + V, '16px')}{two('ความหมายสัญลักษณ์', 'ดาว ราศี มุมดาว และเรือน')}<span class="rv">{chev}</span></a>
          </div>
        </div>

        <div class="sec">
          <span class="sh">ข้อมูลของฉัน</span>
          <div class="box">
            <button class="row" onClick={backup}>{ri('rgba(127,184,255,.16)', '#7FB8FF', ic(<path d="M12 3v12M7 10l5 5 5-5M5 21h14" />))}{two('สำรองข้อมูล', 'บันทึกทุกคนและโน้ตเป็นไฟล์ JSON')}</button>
            <button class="row" onClick={restore}>{ri('rgba(111,224,192,.16)', '#6FE0C0', ic(<path d="M12 21V9M7 14l5-5 5 5M5 3h14" />))}{two('นำเข้าข้อมูล', 'จากไฟล์ JSON ที่สำรองไว้')}</button>
          </div>
          {msg && <span class="lbl" role="status" style={{ padding: '0 4px', color: '#7FE3C0' }}>{msg}</span>}
          <span class="lbl" style={{ padding: '0 4px' }}>ข้อมูลทั้งหมดเก็บในเครื่องนี้ ไม่มีบัญชีและไม่ส่งขึ้นเน็ต ควรสำรองไว้ก่อนเปลี่ยนเครื่องหรือล้าง Safari</span>
        </div>

        <div class="sec">
          <span class="sh">เกี่ยวกับแอป</span>
          <div class="box">
            <div class="row"><span style={{ flex: 1 }}>ช่วงปีที่คำนวณได้</span><span class="rv">พ.ศ. 2538 เป็นต้นไป</span></div>
            <div class="row"><span style={{ flex: 1 }}>เครื่องคำนวณ</span><span class="rv">Swiss Ephemeris · ออฟไลน์</span></div>
            <div class="row"><span style={{ flex: 1 }}>เวอร์ชัน</span><span class="rv">{VERSION}</span></div>
          </div>
        </div>
      </div>
      <TabBar active="settings" />
    </Page>
  )
}
