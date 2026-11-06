// หน้า "ช่วงดาวถอยหลัง" — ตาม design/Retrograde.dc.html
// [dev] #/retrograde?at=2026-11-03T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import { computeChart, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { retroCycles, type RetroCycle } from '../engine/retro.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { HOUSE_TOPIC, SIGN_TH } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(255,138,76,.28),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(138,92,255,.30),transparent 70%),radial-gradient(500px 420px at 90% 1400px,rgba(59,107,255,.22),transparent 70%),#06070D'
const V = '︎'
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const P: Partial<Record<Pt, [string, string, string]>> = { m: ['☿', 'พุธ', '#B5D6FF'], V: ['♀', 'ศุกร์', '#FF8FB1'], a: ['♂', 'อังคาร', '#FF7A59'], J: ['♃', 'พฤหัสบดี', '#F3D46E'], s: ['♄', 'เสาร์', '#8FD47A'], U: ['♅', 'ยูเรนัส', '#7FB8FF'], N: ['♆', 'เนปจูน', '#6FE0C0'], P: ['♇', 'พลูโต', '#FF8FB1'] }
const ORDER: Pt[] = ['m', 'V', 'a', 'J', 's', 'U', 'N', 'P']
const tp = (jd: number) => thaiParts(dateOfJd(jd))
const fd = (jd: number) => { const p = tp(jd); return `${p.d} ${MS[p.mo - 1]} ${String(p.y + 543).slice(2)}` }
const sgDeg = (lon: number) => `${SIGN_TH[Math.floor(lon / 30)]} ${Math.floor(lon % 30)}°`
/** คลัง retrograde: "…: เรื่องX มักช้าลง… · ควรทำ: Y" */
function lib3(lib: InterpLib, k: string) {
  const b = splitTitle(text(lib, 'retrograde', k) ?? '').body
  const topic = /^เรื่อง(.*?)มักช้าลง/.exec(b)?.[1]?.trim() ?? ''
  const tip = b.split(' · ควรทำ: ')[1] ?? b
  return { topic, tip, body: b }
}
type Ph = -1 | 0 | 1 | 2 | 3
const phase = (c: RetroCycle, now: number): Ph => (now < c.pre ? -1 : now < c.r ? 0 : now < c.d ? 1 : now < c.post ? 2 : 3)

interface Data { now: number; natal: Chart | null; known: boolean; cy: RetroCycle[]; lib: InterpLib; m0: { y: number; mo: number }; jdOfMonth: (k: number) => number }

export function Retrograde() {
  const [d, setD] = useState<Data | null>(null)
  const [rp, setRp] = useState<Pt | null>(null)
  const [sel, setSel] = useState(-1)
  const [rg, setRg] = useState(6)
  const [off, setOff] = useState(0)
  useEffect(() => {
    ;(async () => {
      const [swe, lib, me] = await Promise.all([getBrowserSwe(), loadLib(), getMe()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const t = tp(now)
      const jdOfMonth = (k: number) => { const mm = t.mo - 1 + k; return swe.julday(t.y + Math.floor(mm / 12), (mm % 12 + 12) % 12 + 1, 1, -7) }
      const cy = retroCycles(swe, jdOfMonth(0), jdOfMonth(14))
      const natal = me ? computeChart(swe, birthInput(me)) : null
      setD({ now, natal, known: !!me && timeKnown(me), cy, lib, m0: { y: t.y, mo: t.mo }, jdOfMonth })
      // ค่าเริ่มต้นตามดีไซน์: ดาวถอยหลังดวงแรกตามลำดับ พุธ ศุกร์ … พลูโต
      const curI = cy.map((c, i) => [c, i] as const).filter(([c]) => phase(c, now) === 1).sort(([a], [b]) => ORDER.indexOf(a.p) - ORDER.indexOf(b.p))
      setRp(curI[0]?.[0].p ?? null)
      setSel(curI[0]?.[1] ?? cy.findIndex((c) => phase(c, now) === -1))
    })().catch(() => {})
  }, [])

  const houses = (c: RetroCycle) => {
    if (!d?.natal || !d.known) return null
    const a = d.natal.house(c.dLon), b = d.natal.house(c.rLon)
    return a === b ? [a] : [a, b]
  }
  const nowT = d ? tp(d.now) : null
  const cur = d ? d.cy.filter((c) => phase(c, d.now) === 1).sort((x, y) => ORDER.indexOf(x.p) - ORDER.indexOf(y.p)) : []
  const rc = cur.find((c) => c.p === rp) ?? cur[0]
  const maxOff = Math.floor(14 / rg) - (14 % rg ? 0 : 1)
  const W0 = d ? d.jdOfMonth(off * rg) : 0, W1 = d ? d.jdOfMonth(off * rg + rg) : 1
  const x = (t: number) => (t - W0) / (W1 - W0)
  const cl = (v: number) => Math.max(0, Math.min(1, v))
  const mLabel = (k: number) => { const mm = d!.m0.mo - 1 + k; return { mo: (mm % 12 + 12) % 12, y: d!.m0.y + Math.floor(mm / 12) } }
  const S = d && sel >= 0 ? d.cy[sel] : undefined
  const same = S && d ? d.cy.map((c, i) => [c, i] as const).filter(([c]) => c.p === S.p).map(([, i]) => i) : []
  const pos = S ? same.indexOf(sel) : -1
  const stat = (c: RetroCycle): [string, string, string, Ph, string] => {
    const ph = phase(c, d!.now)
    if (ph === -1) { const m = Math.round((c.pre - d!.now) / 30.4); return [`อีก ${m < 1 ? '<1' : m} เดือน`, '#C9CEDC', 'rgba(255,255,255,.08)', -1, `อีก ${m < 1 ? '<1' : m} ด.`] }
    if (ph === 0) return ['ตอนนี้: เงาก่อน', '#FFB08A', 'rgba(255,176,138,.18)', 0, 'เงาก่อน']
    if (ph === 1) return ['กำลังถอยหลัง', '#06070D', '#FF8A4C', 1, 'ถอยหลัง']
    if (ph === 2) return ['ตอนนี้: เงาหลัง', '#7FE3C0', 'rgba(127,227,192,.18)', 2, 'เงาหลัง']
    return ['ผ่านไปแล้ว', '#9AA1B5', 'rgba(255,255,255,.06)', 3, 'ผ่านแล้ว']
  }
  const intro: [string, string][] = [['คืออะไร', 'ช่วงที่ดาวดูเหมือนเดินถอยหลัง รวมช่วงเงาก่อนและหลัง'], ['ใช้ดู', 'ดูว่าช่วงไหนควรทบทวน แก้ไข ทำซ้ำ มากกว่าเริ่มใหม่'], ['ทำไมสำคัญ', 'เรื่องที่ดาวนั้นดูแลมักช้าหรือต้องย้อนกลับไปทำ ถ้ารู้ล่วงหน้าจะวางแผนได้']]
  const navBtn = (lbl: string, on: boolean, f: () => void, dir: 'l' | 'r') => <button onClick={f} aria-label={lbl} style={{ width: '36px', height: '36px', borderRadius: '12px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#F2F4FA', opacity: on ? 1 : 0.35 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d={dir === 'l' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} /></svg></button>

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{nowT ? `${nowT.d} ${MS[nowT.mo - 1]} ${nowT.y + 543}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ช่วงดาวถอยหลัง</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Retrograde · Shadow)</span>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.6, marginTop: '4px' }}>บางช่วงดาวดูเหมือนเดินถอยหลังเมื่อมองจากโลก เรื่องของดาวนั้นจะช้าลง ย้อนกลับมาให้ทบทวน ช่วงเงา (Shadow) คือช่วงก่อนและหลังที่ดาวเดินผ่านองศาเดิม</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          {d && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(255,138,76,.30),rgba(138,92,255,.30) 60%,rgba(59,107,255,.22))', border: '1px solid rgba(255,170,130,.35)' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#FFD0BA' }}><span>{cur.length ? `ตอนนี้ถอยหลังอยู่ ${cur.length} ดวง` : 'ตอนนี้ไม่มีดาวถอยหลัง'}</span>{cur.length > 1 && <span style={{ fontWeight: 400, color: '#C9CEDC' }}>แตะดาวเพื่อดู</span>}</span>
              {cur.length > 0 && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{cur.map((c) => { const q = P[c.p]!, on = c === rc; return <button onClick={() => { setRp(c.p); setSel(d.cy.indexOf(c)) }} aria-pressed={on} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 10px', borderRadius: '10px', border: `1.5px solid ${on ? '#FFB08A' : 'transparent'}`, background: on ? 'rgba(255,176,138,.18)' : 'rgba(6,7,13,.45)', color: '#F2F4FA', font: '500 13px var(--font)' }}><b style={{ color: q[2], fontSize: '15px' }}>{q[0] + V}</b>{q[1]}<span style={{ color: '#FF8A4C', fontWeight: 700, fontSize: '11px' }}>R</span></button> })}</div>}
              {rc && (() => {
                const q = P[rc.p]!, L = lib3(d.lib, rc.p), hs = houses(rc)
                const days = Math.round(rc.d - d.now)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.40)' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>{q[0] + V} {q[1]}ถอยหลังในราศี{SIGN_TH[Math.floor(rc.rLon / 30)]}</span>
                    <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.55 }}>กลับมาเดินหน้า {fd(rc.d)} (อีก {days} วัน){hs ? ` · ตกเรือน ${hs.join('–')} ของคุณ` : ''}: เรื่อง{L.topic}</span>
                    <span style={{ fontSize: '13px', color: '#E6E9F2', lineHeight: 1.55 }}>{L.tip}</span>
                  </div>
                )
              })()}
            </div>
          )}

          {d && (
            <div class="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>ภาพรวม</span><span class="lbl">แตะแท่งเพื่ออ่าน</span></div>
              <div role="tablist" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px', background: 'rgba(255,255,255,.07)' }}>
                {([[3, '3 เดือน'], [6, '6 เดือน'], [12, '1 ปี']] as const).map(([g, l]) => <button role="tab" aria-selected={rg === g} class={rg === g ? 'seg on' : 'seg'} onClick={() => { setRg(g); setOff(0) }} style={{ height: '34px' }}>{l}</button>)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {navBtn('ช่วงก่อน', off > 0, () => off > 0 && setOff(off - 1), 'l')}
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{(() => { const a = mLabel(off * rg), b = mLabel(off * rg + rg - 1); return `${MS[a.mo]} ${String(a.y + 543).slice(2)} – ${MS[b.mo]} ${String(b.y + 543).slice(2)}` })()}</span>
                {navBtn('ช่วงถัดไป', off < maxOff, () => off < maxOff && setOff(off + 1), 'r')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '58px minmax(0,1fr)', gap: '8px 6px', alignItems: 'center' }}>
                <span />
                <div style={{ position: 'relative', height: '14px' }}>
                  {Array.from({ length: rg }, (_, mi) => mi).filter((mi) => rg !== 12 || mi % 2 === 0).map((mi) => { const m = mLabel(off * rg + mi); return <span style={{ position: 'absolute', left: `${(mi / rg) * 100 + (rg === 12 ? 0 : 50 / rg)}%`, transform: 'translateX(-50%)', fontSize: '9.5px', color: '#9AA1B5', whiteSpace: 'nowrap' }}>{MS[m.mo]}{m.mo === 0 || mi === 0 ? ' ' + String(m.y + 543).slice(2) : ''}</span> })}
                </div>
                {ORDER.map((k) => {
                  const q = P[k]!
                  return (
                    <>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}><b style={{ color: q[2], fontSize: '14px', width: '16px', textAlign: 'center' }}>{q[0] + V}</b>{q[1]}</span>
                      <div style={{ position: 'relative', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,.035)', overflow: 'hidden' }}>
                        <span style={{ position: 'absolute', left: `${x(d.now) * 100}%`, top: 0, bottom: 0, width: '2px', background: '#B9A6FF', opacity: d.now >= W0 && d.now < W1 ? 0.9 : 0 }} />
                        {d.cy.map((c, i) => {
                          if (c.p !== k || c.post < W0 || c.pre > W1) return null
                          const L0 = cl(x(c.pre)), L1 = cl(x(c.post)), w = L1 - L0
                          if (w <= 0) return null
                          const rel = (t: number) => Math.max(0, Math.min(100, ((cl(x(t)) - L0) / w) * 100))
                          const on = i === sel, s = stat(c)
                          return (
                            <button onClick={() => setSel(i)} aria-pressed={on} style={{ position: 'absolute', top: '4px', bottom: '4px', left: `${L0 * 100}%`, width: `${w * 100}%`, minWidth: '14px', padding: 0, border: 'none', borderRadius: '8px', overflow: 'hidden', background: 'transparent', boxShadow: on ? '0 0 0 2px #F2F4FA,0 0 12px rgba(255,255,255,.4)' : 'none', cursor: 'pointer' }}>
                              <span style={{ position: 'absolute', top: '13px', height: '6px', left: 0, width: `${rel(c.r)}%`, background: 'rgba(255,176,138,.55)', borderRadius: '4px 0 0 4px' }} />
                              <span style={{ position: 'absolute', top: '9px', height: '14px', left: `${rel(c.r)}%`, width: `${rel(c.d) - rel(c.r)}%`, background: '#FF8A4C', borderRadius: '4px' }} />
                              <span style={{ position: 'absolute', top: '13px', height: '6px', left: `${rel(c.d)}%`, right: 0, background: 'rgba(127,227,192,.55)', borderRadius: '0 4px 4px 0' }} />
                              <span style={{ position: 'absolute', left: '2px', right: '2px', bottom: '1px', fontSize: '9.5px', lineHeight: 1.1, textAlign: 'center', color: s[3] >= 0 && s[3] < 3 ? '#F2F4FA' : '#9AA1B5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w > 0.16 ? s[4] : ''}</span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11.5px', color: '#C9CEDC' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '16px', height: '6px', borderRadius: '4px', background: 'rgba(255,176,138,.7)' }} />เงาก่อน</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '16px', height: '12px', borderRadius: '4px', background: '#FF8A4C' }} />ถอยหลัง (R)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '16px', height: '6px', borderRadius: '4px', background: 'rgba(127,227,192,.7)' }} />เงาหลัง</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '2px', height: '12px', background: '#B9A6FF' }} />วันนี้</span>
              </div>
            </div>
          )}

          {d && S && (() => {
            const q = P[S.p]!, L = lib3(d.lib, S.p), s = stat(S), hs = houses(S), ph = s[3]
            const pre = splitTitle(text(d.lib, 'retrograde', 'pre') ?? '').body, post = splitTitle(text(d.lib, 'retrograde', 'post') ?? '').body
            const phases: [string, string, string, string, boolean][] = [
              ['ช่วงเงาก่อนถอยหลัง', `${fd(S.pre)} – ${fd(S.r)}`, pre, '#FFB08A', ph === 0],
              ['ถอยหลัง (R)', `${fd(S.r)} – ${fd(S.d)}`, L.tip, '#FF8A4C', ph === 1],
              ['ช่วงเงาหลังเดินหน้า', `${fd(S.d)} – ${fd(S.post)}`, post, '#7FE3C0', ph === 2],
            ]
            return (
              <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderColor: 'rgba(255,138,76,.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ width: '44px', height: '44px', flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: q[2], background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.12)' }}>{q[0] + V}</span><div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, flex: 1, minWidth: 0 }}><span style={{ fontSize: '17px', fontWeight: 600 }}>{q[1]}ถอยหลัง {fd(S.r)} – {fd(S.d)}</span><span class="lbl">จาก {sgDeg(S.rLon)} ย้อนไปถึง {sgDeg(S.dLon)} · เรื่อง{L.topic}</span></div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ flex: 'none', height: '26px', padding: '0 10px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', fontSize: '12px', fontWeight: 600, color: s[1], background: s[2] }}>{s[0]}</span>
                  <span class="lbl" style={{ marginLeft: 'auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>รอบที่ {pos + 1} จาก {same.length} ของ{q[1]}</span>
                  <button onClick={() => pos > 0 && setSel(same[pos - 1]!)} aria-label="รอบก่อน" style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#F2F4FA', opacity: pos > 0 ? 1 : 0.35 }}>‹</button>
                  <button onClick={() => pos < same.length - 1 && setSel(same[pos + 1]!)} aria-label="รอบถัดไป" style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#F2F4FA', opacity: pos < same.length - 1 ? 1 : 0.35 }}>›</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {phases.map(([t, dd, m, c, now], i) => (
                    <div style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ width: '12px', height: '12px', marginTop: '4px', borderRadius: '50%', background: c, boxShadow: now ? `0 0 10px ${c}` : 'none' }} />{i < 2 && <span style={{ flex: 1, width: '2px', background: 'rgba(255,255,255,.12)' }} />}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '14px' }}><span style={{ fontSize: '14px', fontWeight: 600, color: c }}>{t} {now && <span style={{ fontSize: '11px', fontWeight: 600, color: '#06070D', background: c, borderRadius: '6px', padding: '1px 6px' }}>ตอนนี้</span>}</span><span style={{ fontSize: '12.5px', color: '#F2F4FA' }}>{dd}</span><span style={{ fontSize: '12.5px', lineHeight: 1.55, color: '#C9CEDC' }}>{m}</span></div>
                    </div>
                  ))}
                </div>
                {hs && <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '12px', color: '#9AA1B5' }}>ตกในชาร์ตของคุณ</span><span style={{ fontSize: '13.5px', lineHeight: 1.6 }}>ตกเรือน {hs.join('–')} ของคุณ · {hs.map((h) => HOUSE_TOPIC[h]).join(' / ')} — ช่วงนี้เรื่องเหล่านี้จะย้อนกลับมาให้ทบทวน</span></div>}
              </div>
            )
          })()}

          <span class="lbl">คำนวณจากตำแหน่งดาวจริง เวลาไทย · จุดหยุดหาด้วยการแบ่งครึ่งช่วง</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
