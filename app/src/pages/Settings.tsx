// หน้า "ตั้งค่า" — ตาม design/Settings.dc.html
import { useState } from 'preact/hooks'
import { getThemePref, setThemePref, type ThemePref } from '../ui/theme.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import { CHANGELOG } from '../data/changelog.ts'
import './settings.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(59,107,255,.40),transparent 70%),radial-gradient(460px 380px at -10% 360px,rgba(138,92,255,.28),transparent 70%),#06070D'
const V = '︎'
const VERSION = __APP_VERSION__

const chev = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
const ri = (bg: string, fg: string, kids: preact.ComponentChildren, fs?: string) => <span class="ri" style={{ background: bg, color: fg, ...(fs ? { fontSize: fs } : {}) }}>{kids}</span>
const two = (a: string, b: string) => <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span>{a}</span><span class="lbl">{b}</span></span>

export function Settings() {
  const [th, setTh] = useState<ThemePref>(getThemePref())
  const [news, setNews] = useState(false)
  const theme = (v: ThemePref) => { setThemePref(v); setTh(v); location.reload() }

  return (
    <Page background={BG}>
      <div class="pg-settings" style={{ padding: '62px 20px 140px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>ตั้งค่า</h1>

        {/* ผู้ใช้ขอ: มีอะไรใหม่ ไว้บนสุด กดดูรายการฟีเจอร์ */}
        <div style={{ borderRadius: '18px', background: 'linear-gradient(135deg,rgba(138,92,255,.28),rgba(59,107,255,.18))', border: '1px solid rgba(180,170,255,.35)', overflow: 'hidden' }}>
          <button aria-expanded={news} onClick={() => setNews(!news)} style={{ width: '100%', display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 16px', border: 'none', background: 'transparent', color: '#F2F4FA', font: 'inherit', textAlign: 'left' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D6CEFF" stroke-width="1.8" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>
            <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>มีอะไรใหม่</span>
              <span style={{ fontSize: '12px', color: '#C9CEDC' }}>อัปเดต {CHANGELOG[0]!.date} · {CHANGELOG[0]!.items.length} ฟีเจอร์ใหม่ · เวอร์ชัน {VERSION}</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9CEDC" stroke-width="2" aria-hidden="true" style={{ transform: news ? 'rotate(180deg)' : undefined }}><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {news && (
            <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {CHANGELOG.map((g) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#D6CEFF' }}>{g.date}</span>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13.5px', lineHeight: 1.55, color: '#DCE0EA' }}>{g.items.map((t) => <li>{t}</li>)}</ul>
                </div>
              ))}
            </div>
          )}
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
