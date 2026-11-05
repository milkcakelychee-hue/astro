// หน้า "ปฏิทินดวงส่วนตัว" — ตาม design/Calendar.dc.html
// [dev] #/calendar?at=2026-11-01T10:00 = จำลองวันนี้
import { useEffect, useMemo, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { calendarMonth, type CalMonth, type MoonQ } from '../engine/calendar.ts'
import { computeChart, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { dateOfJd, thaiParts } from '../engine/sky.ts'
import type { Swe } from '../engine/swe.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, splitTitle, text, transitKey, type InterpLib } from '../lib/interp.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './calendar.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 360px,rgba(59,107,255,.30),transparent 70%),radial-gradient(500px 420px at 80% 1300px,rgba(31,165,135,.22),transparent 70%),#06070D'
const V = '︎'
const MONTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const WD = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const PL: Partial<Record<Pt, [string, string]>> = {
  S: ['☉', 'อาทิตย์'], M: ['☽', 'จันทร์'], m: ['☿', 'พุธ'], V: ['♀', 'ศุกร์'], a: ['♂', 'อังคาร'], J: ['♃', 'พฤหัสบดี'], s: ['♄', 'เสาร์'],
  U: ['♅', 'ยูเรนัส'], N: ['♆', 'เนปจูน'], P: ['♇', 'พลูโต'], A: ['AC', 'ลัคนา'], C: ['MC', 'กลางฟ้า'],
}
const AS: Record<AspectType, [string, string, string, string, string, string]> = {
  '0': ['☌', '#F3D46E', 'rgba(243,212,110,.14)', 'rgba(243,212,110,.35)', 'กุม', 'Conjunction'],
  '6': ['⚹', '#7FB8FF', 'rgba(127,184,255,.14)', 'rgba(127,184,255,.35)', 'โยค', 'Sextile'],
  '4': ['□', '#FF8A4C', 'rgba(255,138,76,.14)', 'rgba(255,138,76,.35)', 'ฉาก', 'Square'],
  '3': ['△', '#4FD1A5', 'rgba(79,209,165,.14)', 'rgba(79,209,165,.35)', 'ตรีโกณ', 'Trine'],
  '8': ['☍', '#FF6B6B', 'rgba(255,107,107,.14)', 'rgba(255,107,107,.35)', 'เล็ง', 'Opposition'],
}
const TONE: Record<AspectType, string> = { '0': '#F3D46E', '6': '#4FD1A5', '3': '#4FD1A5', '4': '#FF8A4C', '8': '#FF8A4C' }
const good = (t: AspectType) => t === '3' || t === '6'
const hard = (t: AspectType) => t === '4' || t === '8'
const MOON_G: Record<MoonQ, string> = { new: '●', fq: '◐', full: '○', lq: '◑' }
const MOON_K: Record<MoonQ, string> = { new: 'new', fq: 'first_quarter', full: 'full', lq: 'last_quarter' }
const g = (s: string) => (s.length > 1 ? s : s + V)
const chev = (d: string) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d={d} /></svg>

/** ข้อความคลังทรานซิต: ตัด "แก่นเรื่อง:" และ "ผลราว…" (วันนี้คือวันมุมพอดี) */
function meaning(lib: InterpLib, t: Pt, type: AspectType, n: Pt): string | null {
  const s = text(lib, 'transit', transitKey(t, type, n))
  if (!s) return null
  return splitTitle(s).body.replace(/^แก่นเรื่อง: /, '').split(' · ').filter((x) => !x.startsWith('ผลราว')).join(' · ')
}

interface Ctx { swe: Swe; lib: InterpLib; natal: Chart; known: boolean; name: string; today: { y: number; mo: number; d: number } }

export function Calendar() {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) { location.hash = '#/main'; return }
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const tp = thaiParts(at ? new Date(at + ':00+07:00') : new Date())
      setCtx({ swe, lib, natal: computeChart(swe, birthInput(me)), known: timeKnown(me), name: me.name, today: { y: tp.y, mo: tp.mo, d: tp.d } })
    })().catch((e: unknown) => setErr(String(e)))
  }, [])
  if (err) return <Page background={BG}><div style={{ padding: '62px 20px', color: '#FF9A9A' }}>{err}</div><TabBar active="forecast" /></Page>
  if (!ctx) return <Page background={BG}><TabBar active="forecast" /></Page>
  return <CalendarView ctx={ctx} />
}

function CalendarView({ ctx }: { ctx: Ctx }) {
  const { today } = ctx
  // ดีไซน์: เดือนนี้ถึงอีก 2 เดือนข้างหน้า
  const [off, setOff] = useState(0)
  const [sel, setSel] = useState(today.d)
  const y = today.y + Math.floor((today.mo - 1 + off) / 12)
  const mo = ((today.mo - 1 + off) % 12) + 1
  const m: CalMonth = useMemo(() => calendarMonth(ctx.swe, ctx.natal, y, mo, ctx.known), [y, mo])
  const days = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  const first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay()
  const isToday = (d: number) => off === 0 && d === today.d

  const byDay = (d: number) => m.events.filter((e) => e.day === d)
  const toneOf = (d: number) => {
    const ev = byDay(d)
    const gd = ev.filter((e) => good(e.type)).length, hd = ev.filter((e) => hard(e.type)).length
    return !ev.length ? 'none' : gd > hd ? 'good' : hd > gd ? 'hard' : 'mix'
  }
  // วันเด่น: วันที่โทนชัด เรียงตามจำนวนมุมโทนนั้นมากสุด เลือก 4 วัน แล้วแสดงตามวันที่
  const top = (k: 'good' | 'hard') => {
    const f = k === 'good' ? good : hard
    return Array.from({ length: days }, (_, i) => i + 1).filter((d) => toneOf(d) === k)
      .sort((a, b) => byDay(b).filter((e) => f(e.type)).length - byDay(a).filter((e) => f(e.type)).length || a - b)
      .slice(0, 4).sort((a, b) => a - b)
  }

  const rxNote = m.rxUntil.filter((r) => r.p === 'm').map((r) => {
    const p = thaiParts(dateOfJd(r.jd))
    return `พุธถอยหลังถึง ${p.d} ${MON[p.mo - 1]}`
  })[0]
  const selEv = byDay(sel)
  const tone = toneOf(sel)
  const toneT = { none: ['วันปกติ', '#C9CEDC', 'rgba(255,255,255,.08)'], good: ['วันส่งเสริม', '#7FE3C0', 'rgba(79,209,165,.16)'], hard: ['วันท้าทาย', '#FFB08A', 'rgba(255,138,76,.16)'], mix: ['ผสม', '#F3D46E', 'rgba(243,212,110,.16)'] }[tone]
  const notes: { g: string; c: string; bg: string; t: string }[] = []
  const mq = m.moon[sel]
  if (mq) {
    const t = text(ctx.lib, 'moon', MOON_K[mq])
    if (t) notes.push({ g: MOON_G[mq], c: '#DCE3F5', bg: 'rgba(220,227,245,.08)', t: t.replace(': ', ' ') })
  }
  for (const s of m.stations.filter((s) => s.day === sel)) {
    const nm = s.p === 'm' ? 'พุธ' : 'ศุกร์'
    const r = s.dir === 'R' ? text(ctx.lib, 'retrograde', s.p) : null
    notes.push({ g: '℞', c: '#FF6B9A', bg: 'rgba(255,107,154,.10)', t: s.dir === 'D' ? `ดาว${nm}เดินหน้า (Direct) วันนี้` : `ดาว${nm}เริ่มถอยหลัง (Retrograde) วันนี้${r ? ' · ' + splitTitle(r).body.split(' · ')[0] : ''}` })
  }

  const go = (o: number) => { if (o < 0 || o > 2) return; setOff(o); setSel(o === 0 ? today.d : 0) }  // เดือนอื่น: ยังไม่เลือกวัน (ผู้ใช้ขอ)
  const cells = []
  for (let k = 0; k < first; k++) cells.push(<span />)
  for (let d = 1; d <= days; d++) {
    const ev = byDay(d)
    const tones: string[] = []
    ev.forEach((e) => { if (!tones.includes(TONE[e.type])) tones.push(TONE[e.type]) })
    // ปักวันนี้เสมอ แม้ถูกเลือก (ผู้ใช้ขอ)
    const on = d === sel, td = isToday(d)
    const rx = m.rx[d] === 'full' ? '#FF6B9A' : m.rx[d] === 'part' ? 'rgba(255,107,154,.45)' : 'transparent'
    cells.push(
      <button class="day" onClick={() => setSel(d)} aria-pressed={on} aria-label={`${d} ${MONTH[mo - 1]}`}
        style={{ ...(on ? { background: 'linear-gradient(160deg,rgba(138,92,255,.55),rgba(31,165,135,.35))' } : ev.length ? { background: 'rgba(255,255,255,.05)' } : {}), ...(td ? { boxShadow: on ? 'inset 0 0 0 2px #D6CEFF' : 'inset 0 0 0 1.5px #B9A6FF' } : {}) }}>
        <span style={on ? { fontWeight: 700 } : td ? { color: '#D6CEFF', fontWeight: 700 } : ev.length ? {} : { color: '#9AA1B5' }}>{d}</span>
        <span class="dots">{tones.map((c) => <i style={{ background: c }} />)}</span>
        <span style={{ position: 'absolute', top: '4px', right: '5px', fontSize: '9px', color: '#DCE3F5' }}>{m.moon[d] ? MOON_G[m.moon[d]!] : ''}</span>
        <span style={{ position: 'absolute', left: '4px', right: '4px', bottom: '4px', height: '3px', borderRadius: '9px', background: rx }} />
      </button>,
    )
  }
  const wd = (first + sel - 1) % 7
  const gd = top('good'), hd = top('hard')

  return (
    <Page background={BG}>
      <div class="pg-cal">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}>{chev('m15 6-6 6 6 6')}ดูดวงล่วงหน้า</a>
          <button onClick={() => go(0)} style={{ height: '36px', padding: '0 14px', marginRight: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#F2F4FA', font: '500 13px var(--font)' }}>วันนี้</button>
        </div>

        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">ชาร์ตของ {ctx.name}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600 }}>ปฏิทินดวงส่วนตัว <span style={{ fontSize: '15px', color: '#9AA1B5', fontWeight: 400 }}>(Personal calendar)</span></h1>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.6 }}>วันที่ดาวบนฟ้าทำมุมพอดีกับดาวในชาร์ตเกิดของคุณ</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {[['คืออะไร', 'ปฏิทินรายเดือนที่รวมวันที่ดาวจร (Transit) ทำมุมตรงพอดีกับดาวในชาร์ตของเรา'], ['ใช้ดู', 'วางแผนงาน นัดหมาย และเตรียมใจล่วงหน้าเป็นรายวัน'], ['ทำไมสำคัญ', 'รู้ว่าวันไหนพลังหนุนหรือกดดัน ช่วยเลือกจังหวะทำเรื่องสำคัญ']].map(([k, v]) => (
                  <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>
                ))}
              </div>
            </details>
          </div>

          <div class="card" style={{ padding: '14px 12px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
              <button class="nav" aria-label="เดือนก่อน" onClick={() => go(off - 1)} style={{ opacity: off > 0 ? 1 : 0.3 }}>{chev('m15 6-6 6 6 6')}</button>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 600 }}>{MONTH[mo - 1]} {y + 543}</span>
                <span class="lbl">{m.events.length} เหตุการณ์{rxNote ? ' · ' + rxNote : ''}</span>
              </div>
              <button class="nav" aria-label="เดือนถัดไป" onClick={() => go(off + 1)} style={{ opacity: off < 2 ? 1 : 0.3 }}>{chev('m9 6 6 6-6 6')}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))' }}>
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((w) => <span class="wd">{w}</span>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '2px' }}>{cells}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '6px 10px', padding: '10px 4px 2px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
              <span class="lg"><i style={{ width: '8px', height: '8px', borderRadius: '9px', background: '#4FD1A5' }} />วันส่งเสริม (Trine · Sextile)</span>
              <span class="lg"><i style={{ width: '8px', height: '8px', borderRadius: '9px', background: '#FF8A4C' }} />วันท้าทาย (Square · Opposition)</span>
              <span class="lg"><i style={{ width: '8px', height: '8px', borderRadius: '9px', background: '#F3D46E' }} />กุมกัน (Conjunction)</span>
              <span class="lg"><i style={{ width: '14px', height: '3px', borderRadius: '9px', background: '#FF6B9A' }} />ดาวพุธ/ศุกร์ถอยหลัง</span>
              <span class="lg"><b style={{ color: '#DCE3F5', fontSize: '11px' }}>● ○ ◐ ◑</b>ข้างขึ้น-แรม</span>
            </div>
          </div>

          {sel === 0 ? (
            <div class="card" style={{ padding: '18px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: '#C9CEDC' }}>แตะวันที่ในปฏิทินเพื่อดูรายละเอียด</span>
            </div>
          ) : (
          <div class="card" style={{ padding: '16px 16px 4px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span class="lbl">{isToday(sel) ? 'วันนี้' : 'วันที่เลือก'}</span>
                <span style={{ fontSize: '20px', fontWeight: 600 }}>วัน{WD[wd]}ที่ {sel} {MON[mo - 1]} {y + 543}</span>
              </div>
              <span class="chip" style={{ color: toneT[1], background: toneT[2], height: '26px', fontSize: '12px' }}>{toneT[0]}</span>
            </div>
            {notes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px' }}>
                {notes.map((n) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '14px', background: n.bg }}><span style={{ fontSize: '16px', color: n.c }}>{n.g}</span><span style={{ fontSize: '13px', lineHeight: 1.5, color: '#DCE0EA' }}>{n.t}</span></div>
                ))}
              </div>
            )}
            {selEv.map((e) => {
              const a = AS[e.type], t = PL[e.t]!, n = PL[e.n]!
              const mean = meaning(ctx.lib, e.t, e.type, e.n)
              return (
                <div class="ev">
                  <span class="ei" style={{ color: a[1], background: a[2], border: `1px solid ${a[3]}` }}>{g(a[0])}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.45 }}>{t[1]} <span style={{ color: a[1] }}>{a[4]}</span> {n[1]}เดิม</span>
                    <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span class="chip" style={{ color: '#C9CEDC', background: 'rgba(255,255,255,.07)' }}>ดาวบนฟ้า {g(t[0])}</span>
                      <span class="chip" style={{ color: '#C9CEDC', background: 'rgba(255,255,255,.07)' }}>ดาวเกิด {g(n[0])}</span>
                      <span class="chip" style={{ color: a[1], background: a[2] }}>{a[5]}</span>
                    </span>
                    {mean && <span style={{ fontSize: '13px', lineHeight: 1.65, color: '#DCE0EA' }}>{mean}</span>}
                  </div>
                </div>
              )
            })}
            {!selEv.length && (
              <div style={{ padding: '18px 0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9AA1B5" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M8 12h8" /></svg>
                <span style={{ fontSize: '14px', color: '#C9CEDC' }}>วันนี้ไม่มีดาวทำมุมพอดีกับชาร์ตคุณ</span>
                <span class="lbl">เป็นวันปกติ ใช้พลังจากช่วงก่อนหน้าได้ต่อ</span>
              </div>
            )}
          </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>วันเด่นของเดือนนี้</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '10px' }}>
              <div class="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', borderColor: 'rgba(79,209,165,.30)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#7FE3C0' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>เหมาะลงมือ</span>
                <span style={{ fontSize: '22px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{gd.length ? gd.join(' · ') : '–'}</span>
                <span class="lbl">มุมส่งเสริม เหมาะเริ่มงาน คุยเรื่องสำคัญ</span>
              </div>
              <div class="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', borderColor: 'rgba(255,138,76,.30)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#FFB08A' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>ใจเย็นไว้</span>
                <span style={{ fontSize: '22px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{hd.length ? hd.join(' · ') : '–'}</span>
                <span class="lbl">มุมท้าทาย ระวังใจร้อน อย่าตัดสินใจเร็ว</span>
              </div>
            </div>
            <span class="lbl">คำนวณจากตำแหน่งดาวจริงเทียบชาร์ตเกิด (ดาวอาทิตย์ พุธ ศุกร์ อังคาร พฤหัสบดี เสาร์ บนฟ้า × ดาวเกิด 10 ดวง{ctx.known ? ' ลัคนา และกลางฟ้า' : ''}) นับวันที่มุมพอดีตามเวลาไทย</span>
          </div>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}

