// หน้า "ดาวตอนนี้กระทบชาร์ตฉัน (Transit)" — ตาม design/Transit.dc.html
// [dev] #/transit?at=2026-11-01T12:00 = จำลองเวลาไทย
import { useEffect, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { computeChart, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { bodyAt, dateOfJd, jdOfThai, thaiParts, type Body } from '../engine/sky.ts'
import { transitRows, type TransitRow } from '../engine/transits.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, splitTitle, text, transitKey, type InterpLib } from '../lib/interp.ts'
import { HOUSE_TOPIC, SIGN_TH, fmtDeg, hhmm } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './transit.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(59,107,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(138,92,255,.30),transparent 70%),radial-gradient(500px 420px at 90% 1500px,rgba(31,165,135,.22),transparent 70%),#06070D'
const V = '︎'
const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const P: Partial<Record<Pt, [string, string, string, string]>> = {
  S: ['☉', 'อาทิตย์', '#F3D46E', 'ตัวตน'], M: ['☽', 'จันทร์', '#DCE3F5', 'อารมณ์'], m: ['☿', 'พุธ', '#B5D6FF', 'ความคิด'], V: ['♀', 'ศุกร์', '#FF8FB1', 'ความรัก เงิน'],
  a: ['♂', 'อังคาร', '#FF7A59', 'แรงขับ'], J: ['♃', 'พฤหัสบดี', '#F3D46E', 'โอกาส'], s: ['♄', 'เสาร์', '#8FD47A', 'ความรับผิดชอบ'], U: ['♅', 'ยูเรนัส', '#7FB8FF', 'ความเปลี่ยนแปลง'],
  N: ['♆', 'เนปจูน', '#6FE0C0', 'ความฝัน'], P: ['♇', 'พลูโต', '#FF8FB1', 'การเปลี่ยนลึก'], C: ['MC', 'กลางฟ้า', '#D6CEFF', 'งาน ชื่อเสียง'], A: ['AC', 'ลัคนา', '#D6CEFF', 'ตัวตน ภาพลักษณ์'],
}
const AS: Record<AspectType, [string, string, string, string, string]> = {
  '0': ['☌', '#F3D46E', 'rgba(243,212,110,.16)', 'กุม', 'รวมพลังเป็นก้อนเดียว'], '6': ['⚹', '#7FB8FF', 'rgba(127,184,255,.16)', 'โยค', 'เปิดโอกาสถ้าลงมือ'],
  '4': ['□', '#FF8A4C', 'rgba(255,138,76,.16)', 'ฉาก', 'เสียดทาน ผลักให้แก้'], '3': ['△', '#4FD1A5', 'rgba(79,209,165,.16)', 'ตรีโกณ', 'ไหลลื่น ทำได้ง่าย'], '8': ['☍', '#FF6B6B', 'rgba(255,107,107,.16)', 'เล็ง', 'ต้องหาจุดสมดุล'],
}
const DUR: Partial<Record<Pt, string>> = { M: 'ผลไม่กี่ชั่วโมง', S: 'ผลไม่กี่วัน', m: 'ผลไม่กี่วัน', V: 'ผลไม่กี่วัน', a: 'ผล 1–2 สัปดาห์', J: 'ผลหลายเดือน', s: 'ผลหลายเดือน', U: 'ผลหลายเดือน', N: 'ผลหลายเดือน', P: 'ผลหลายเดือน' }
const GT: [string, string, string, string][] = [
  ['มีอิทธิพลมากที่สุดตอนนี้', '#F3D46E', 'rgba(243,212,110,.35)', 'ใกล้จุดตรงพอดีมาก รู้สึกได้ชัดที่สุดในช่วงนี้'],
  ['กำลังก่อตัว', '#7FE3C0', 'rgba(79,209,165,.30)', 'กำลังเข้าใกล้ ผลจะชัดขึ้นเรื่อย ๆ จนถึงวันตรงพอดี'],
  ['คลายลงแล้ว', '#9AA1B5', 'rgba(255,255,255,.10)', 'ผ่านจุดตรงพอดีไปแล้ว ผลค่อย ๆ จางลง'],
]
const SKY: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']
const g = (s: string) => (s.length > 1 ? s : s + V)
const fd = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.d} ${TH[p.mo - 1]} ${p.y + 543 - 2500}` }
/** แรงที่สุด = orb ไม่เกินครึ่ง และเข้าใกล้ (ถ้าห่างออกต้องไม่เกินหนึ่งในสี่) — ตามดีไซน์ */
const grpOf = (r: TransitRow) => (r.f <= 0.5 && (r.applying || r.f <= 0.25) ? 0 : r.applying ? 1 : 2)

function meaning(lib: InterpLib, r: TransitRow): string {
  const s = text(lib, 'transit', transitKey(r.t, r.type, r.n))
  if (!s) return ''
  return splitTitle(s).body.replace(/^แก่นเรื่อง: /, '').split(' · ').filter((x) => !x.startsWith('ผล')).join(' · ')
}

interface Data { name: string; now: number; nowD: Date; natal: Chart; known: boolean; rows: TransitRow[]; sky: Record<string, Body>; lib: InterpLib }

export function Transit() {
  const [d, setD] = useState<Data | null>(null)
  const [sel, setSel] = useState('')
  // ผู้ใช้ขอ: กล่องนับกดเพื่อกรองรายการตามลักษณะมุม (-1 = ทั้งหมด)
  const [nf, setNf] = useState(-1)
  const natOf = (r: TransitRow) => (r.type === '3' || r.type === '6' ? 0 : r.type === '0' ? 2 : 1)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) return
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const nowD = at ? new Date(at + ':00+07:00') : new Date()
      const now = jdOfThai(swe, nowD)
      const natal = computeChart(swe, birthInput(me))
      const known = timeKnown(me)
      const sky = Object.fromEntries(SKY.map((p) => [p, bodyAt(swe, now, p)]))
      setD({ name: me.name, now, nowD, natal, known, rows: transitRows(swe, natal, now, known), sky, lib })
    })().catch(() => {})
  }, [])

  const intro: [string, string][] = [
    ['คืออะไร', 'ตำแหน่งดาวบนฟ้าตอนนี้ และมุมที่ทำกับดาวในชาร์ตกำเนิด'],
    ['ใช้ดู', 'ดูว่าตอนนี้มีพลังอะไรกำลังมีอิทธิพล กำลังก่อตัว หรือคลายลง'],
    ['ทำไมสำคัญ', 'เข้าใจสถานการณ์และอารมณ์ช่วงนี้ว่ามาจากอะไร และจะอยู่นานแค่ไหน'],
  ]
  const tp = d ? thaiParts(d.nowD) : null

  // ธีมหลัก: ในกลุ่มแรงที่สุด เลือกดาวช้าที่กำลังเข้าใกล้และมีวันตรงพอดีข้างหน้า (ไม่มี → ตัวแรกของกลุ่ม)
  let hero: TransitRow | null = null
  if (d) {
    const strong = d.rows.filter((r) => grpOf(r) === 0)
    hero = strong.find((r) => r.applying && r.passes.some((x) => x >= d.now)) ?? strong[0] ?? d.rows[0] ?? null
  }
  const cnt = d ? [d.rows.filter((r) => r.type === '3' || r.type === '6').length, d.rows.filter((r) => r.type === '4' || r.type === '8').length, d.rows.filter((r) => r.type === '0').length] : [0, 0, 0]

  return (
    <Page background={BG}>
      <div class="pg-tr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d && tp ? `ชาร์ตของ ${d.name} · ${tp.d} ${TH[tp.mo - 1]} ${tp.y + 543} เวลา ${hhmm(tp.hh, tp.mi)} น.` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ดาวตอนนี้กระทบชาร์ตฉัน</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Transit)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, x]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{x}</span></div>)}
              </div>
            </details>
          </div>

          {d && hero && (() => {
            const t = P[hero.t]!, n = P[hero.n]!, a = AS[hero.type]
            const fut = hero.passes.find((x) => x >= d.now)
            const days = fut ? Math.round(fut - d.now) : 0
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(59,107,255,.40),rgba(138,92,255,.30) 55%,rgba(31,165,135,.25))', border: '1px solid rgba(150,170,255,.45)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#C8D3FF' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></svg>ธีมหลักของช่วงนี้</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span class="gl" style={{ width: '44px', height: '44px', fontSize: '20px', color: t[2], background: 'rgba(6,7,13,.45)' }}>{g(t[0])}</span>
                  <span class="ai" style={{ color: a[1], background: a[2].replace('.16', '.18') }}>{a[0] + V}</span>
                  <span class="gl" style={{ width: '44px', height: '44px', fontSize: '20px', color: n[2], background: 'rgba(6,7,13,.45)' }}>{g(n[0])}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, minWidth: 0 }}>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>{t[1]}{a[3]}{n[1]}เดิม</span>
                    <span class="lbl" style={{ color: '#C9CEDC' }}>{fut ? `ตรงพอดี ${fd(fut)} · ${days <= 0 ? 'วันนี้' : `อีก\u00a0${days}\u00a0วัน`}` : hero.applying ? 'กำลังเข้าใกล้จุดตรงพอดี' : 'ผ่านจุดตรงแล้ว กำลังคลายลง'}</span>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E6E9F2' }}>{meaning(d.lib, hero)}</p>
              </div>
            )
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {d && <span style={{ fontSize: '15px', fontWeight: 600 }}>ช่วงนี้มีแรงหนุน {cnt[0]} เรื่อง · แรงกดดัน {cnt[1]} เรื่อง{cnt[2] ? ` · พลังเข้มข้น ${cnt[2]} เรื่อง` : ''}</span>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
              {([[cnt[0], '💚 ส่งเสริม', '#7FE3C0'], [cnt[1], '⚡ ท้าทาย', '#FFB08A'], [cnt[2], '🔥 กุมกัน', '#F3D46E']] as const).map(([x, l, c], i) => (
                <button class="card" aria-pressed={nf === i} onClick={() => setNf(nf === i ? -1 : i)} style={{ padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', borderRadius: '16px', color: '#F2F4FA', font: 'inherit', ...(nf === i ? { borderColor: c, background: 'rgba(255,255,255,.10)', boxShadow: `0 0 12px ${c}55` } : {}) }}><span style={{ fontSize: '22px', fontWeight: 700, color: c }}>{d ? x : '–'}</span><span class="lbl" style={nf === i ? { color: c } : undefined}>{l}</span></button>
              ))}
            </div>
            <span class="lbl">{nf < 0 ? 'แตะกล่องเพื่อดูเฉพาะมุมแบบนั้น' : 'กำลังกรองอยู่ · แตะอีกครั้งเพื่อดูทั้งหมด'}</span>
          </div>

          <div class="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>ตรงพอดี เข้าใกล้ ห่างออก สัมพันธ์กันอย่างไร</span>
            <div style={{ position: 'relative', height: '40px' }}>
              <span style={{ position: 'absolute', left: '4%', right: '4%', top: '14px', height: '3px', borderRadius: '9px', background: 'linear-gradient(90deg,rgba(127,227,192,.15),#7FE3C0 48%,#FFFFFF 50%,#9AA1B5 52%,rgba(154,161,181,.12))' }} />
              <span style={{ position: 'absolute', left: '50%', top: '6px', width: '18px', height: '18px', marginLeft: '-9px', borderRadius: '99px', background: '#F3D46E', boxShadow: '0 0 14px #F3D46E' }} />
              <span style={{ position: 'absolute', left: 0, top: '26px', fontSize: '11px', color: '#7FE3C0' }}>เข้าใกล้ = แรงขึ้น</span>
              <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '26px', fontSize: '11px', color: '#F3D46E', whiteSpace: 'nowrap' }}>ตรงพอดี = แรงสุด</span>
              <span style={{ position: 'absolute', right: 0, top: '26px', fontSize: '11px', color: '#9AA1B5' }}>ห่างออก = คลายลง</span>
            </div>
            <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#C9CEDC' }}>ดาวที่โคจรจะค่อย ๆ <b style={{ color: '#7FE3C0' }}>เข้าใกล้</b>มุมกับดาวเกิด ผลจะชัดขึ้นเรื่อย ๆ จนถึงวัน<b style={{ color: '#F3D46E' }}>ตรงพอดี</b> (orb 0°) ซึ่งเป็นจุดที่รู้สึกได้มากที่สุด หลังจากนั้นดาวจะ<b style={{ color: '#C9CEDC' }}>ห่างออก</b> ผลจะค่อย ๆ จางลง ดาวที่ถอยหลังอาจกลับมาเข้าใกล้อีกรอบ</span>
          </div>

          {d && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {GT.map(([gt, gc, gbd, gd], k) => {
                const rows = d.rows.filter((r) => grpOf(r) === k && (nf < 0 || natOf(r) === nf)).sort((x, y) => x.f - y.f)
                if (!rows.length) return null
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 2px' }}><span style={{ width: '10px', height: '10px', borderRadius: '9px', background: gc, boxShadow: `0 0 10px ${gc}` }} /><span style={{ fontSize: '16px', fontWeight: 600, color: gc }}>{gt}</span><span class="lbl" style={{ marginLeft: 'auto' }}>{rows.length} มุม</span></div>
                    <span class="lbl" style={{ padding: '0 2px' }}>{gd}</span>
                    <div class="card" style={{ overflow: 'hidden', borderColor: gbd }}>
                      {rows.map((r) => {
                        const id = transitKey(r.t, r.type, r.n), open = sel === id
                        const t = P[r.t]!, n = P[r.n]!, a = AS[r.type]
                        const fut = r.passes.filter((x) => x >= d.now)
                        const next = r.applying ? (fut.length ? `จะตรงพอดี ${fd(fut[0])}` : 'กำลังเข้าใกล้จุดตรงพอดี') : r.t === 'M' ? 'ผ่านจุดตรงไปเมื่อไม่กี่ชั่วโมงก่อน' : fut.length ? `ผ่านจุดตรงแล้ว · จะวนกลับมาตรงอีกครั้ง ${fd(fut[0])}` : 'ผ่านจุดตรงแล้ว กำลังคลายลง'
                        const om = Math.floor(r.orb * 60)
                        const mx = (r.applying ? 50 - r.f * 46 : 50 + r.f * 46).toFixed(1) + '%'
                        const nh = r.n === 'A' ? 1 : r.n === 'C' ? 10 : d.natal.house(d.natal.pos[r.n].lon)
                        return (
                          <button class="tr" onClick={() => setSel(open ? '' : id)} aria-expanded={open} style={open ? { background: 'rgba(255,255,255,.05)' } : undefined}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                              <span class="gl" style={{ color: t[2], background: 'rgba(6,7,13,.45)' }}>{g(t[0])}</span>
                              <span class="ai" style={{ color: a[1], background: a[2] }}>{a[0] + V}</span>
                              <span class="gl" style={{ color: '#F2F4FA', background: 'rgba(255,255,255,.06)' }}>{g(n[0])}</span>
                              <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, lineHeight: 1.35 }}><span style={{ fontSize: '14.5px', fontWeight: 600 }}>{t[1]} {a[3]} {n[1]}เดิม</span><span class="lbl">{t[3]} × {n[3]} · {DUR[r.t]}</span></span>
                              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}><span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(om / 60)}°{String(om % 60).padStart(2, '0')}′</span><span style={{ fontSize: '11px', color: r.applying ? '#7FE3C0' : '#9AA1B5', whiteSpace: 'nowrap' }}>{r.applying ? '→ เข้าใกล้' : '← ห่างออก'}</span></span>
                            </span>
                            <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                              <span style={{ position: 'relative', height: '14px' }}>
                                <span style={{ position: 'absolute', left: 0, right: 0, top: '6px', height: '2px', borderRadius: '9px', background: 'linear-gradient(90deg,rgba(127,227,192,.15),rgba(127,227,192,.6) 48%,rgba(255,255,255,.9) 50%,rgba(154,161,181,.5) 52%,rgba(154,161,181,.12))' }} />
                                <span style={{ position: 'absolute', left: '50%', top: '1px', width: '2px', height: '12px', marginLeft: '-1px', background: '#F2F4FA', borderRadius: '2px' }} />
                                <span style={{ position: 'absolute', top: '2px', left: mx, width: '10px', height: '10px', marginLeft: '-5px', borderRadius: '9px', background: a[1], boxShadow: `0 0 8px ${a[1]}` }} />
                              </span>
                              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#9AA1B5' }}><span>← เข้าใกล้</span><span style={{ color: '#F2F4FA' }}>ตรงพอดี</span><span>ห่างออก →</span></span>
                              <span class="lbl">{next}</span>
                            </span>
                            {open && (
                              <span style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)' }}>
                                <span style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '6px', fontSize: '12px' }}>
                                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span class="lbl">ดาว = อะไร</span><span>{t[1]} ({t[3]}) กระตุ้น{n[1]} ({n[3]})</span></span>
                                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span class="lbl">มุม = อย่างไร</span><span>{a[3]}: {a[4]}</span></span>
                                  <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span class="lbl">เรือน = ที่ไหน</span><span>{d.known ? `เรือน ${nh} ${HOUSE_TOPIC[nh]}` : 'ต้องมีเวลาเกิด'}</span></span>
                                </span>
                                <span style={{ fontSize: '13px', lineHeight: 1.65, color: '#DCE0EA' }}>{meaning(d.lib, r)}</span>
                                {r.passes.length > 0 && (
                                  <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}><span class="lbl">วันที่ตรงพอดี</span>
                                    {r.passes.map((x) => { const fu = x >= d.now; return <span class="chip" style={{ color: fu ? '#F2F4FA' : '#9AA1B5', background: fu ? 'rgba(185,166,255,.20)' : 'rgba(255,255,255,.06)' }}>{fd(x)}</span> })}
                                  </span>
                                )}
                              </span>
                            )}
                            <span class="chv" data-o={String(open)} style={{ alignSelf: 'center', margin: '2px auto 0', width: 'max-content', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9AA1B5', lineHeight: 1 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {d?.known && (
            <div class="card" style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '8px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>ดาวบนฟ้าเดินอยู่ในเรือนไหนของคุณ</span><span class="lbl">เรือน = เรื่องในชีวิตที่ดาวนั้นกำลังกระตุ้น</span></div>
              {SKY.map((p) => {
                const b = d.sky[p]!, h = d.natal.house(b.lon), pl = P[p]!
                return <div class="hr"><span style={{ fontSize: '16px', color: pl[2] }}>{g(pl[0])}</span><span>{pl[1]} <span class="lbl">{SIGN_TH[Math.floor(b.lon / 30)]} {fmtDeg(b.lon)}{b.speed < 0 ? ' R' : ''}</span></span><span class="lbl" style={{ textAlign: 'right' }}>{HOUSE_TOPIC[h]}</span><span style={{ justifySelf: 'end', width: '36px', height: '24px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, background: 'rgba(185,166,255,.16)', color: '#D6CEFF' }}>{h}</span></div>
              })}
            </div>
          )}
          <span class="lbl">orb ทรานซิต: ดวงอาทิตย์ ดวงจันทร์ 3° · ดาวอื่น 2° · วันที่ตรงพอดีคิดตามเวลาไทย · ตำแหน่งดาวคำนวณแบบเดียวกับ astro-seek</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
