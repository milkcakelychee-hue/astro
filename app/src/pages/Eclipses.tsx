// หน้า "สุริยุปราคา จันทรุปราคา" — ตาม design/Eclipses.dc.html
// [dev] #/eclipses?at=2026-11-03T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import { computeChart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { eclipses, type Eclipse } from '../engine/eclipses.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { HOUSE_TOPIC, PT_TH, SIGN_TH, hhmm } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const KIND: Record<string, string> = { total: 'เต็มดวง', annular: 'วงแหวน', hybrid: 'ผสม', partial: 'บางส่วน', penumbral: 'เงามัว' }
const NAME: Partial<Record<Pt, string>> = { ...PT_TH, A: 'ลัคนา', C: 'กลางฟ้า' }
const HALF = 182
const tp = (jd: number) => thaiParts(dateOfJd(jd))
const title = (e: Eclipse) => (e.sun ? 'สุริยุปราคา' : 'จันทรุปราคา') + KIND[e.kind]
const pos = (e: Eclipse) => { const m = Math.floor((e.lon % 30) * 60); return `${SIGN_TH[Math.floor(e.lon / 30)]} ${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′` }
const when = (e: Eclipse) => { const p = tp(e.jd); return `${p.d} ${MS[p.mo - 1]} ${p.y + 543} · ${hhmm(p.hh, p.mi)} น.` }
const hitS = (e: Eclipse, dot = 'ดาว') => e.hits.map((h) => `${h.type === '0' ? 'กุม' : 'เล็ง'}${['A', 'C'].includes(h.p) ? '' : dot}${NAME[h.p]} ${h.orb.toFixed(1)}°`).join(', ')
const LT = ['', 'ผลเบา · ตามธีมเรือน', 'ผลแรง · แตะดาวในชาร์ต', 'ผลแรงมาก · แตะดาวแนบชิดหรือแตะดวงอาทิตย์']
const icon = (e: Eclipse, size: number) => {
  const ib = e.sun ? '#FFC46B' : '#C2412D', ii = e.sun ? (e.kind === 'annular' ? '4px' : '2px') : '0'
  const ic = e.sun ? '#0B0C12' : e.kind === 'penumbral' ? 'rgba(233,236,245,.75)' : e.kind === 'partial' ? 'linear-gradient(90deg,#C2412D 55%,#E9ECF5 55%)' : '#A8321F'
  return <span style={{ flex: 'none', position: 'relative', width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: ib, boxShadow: e.sun ? '0 0 12px rgba(255,196,107,.45)' : '0 0 12px rgba(194,65,45,.45)' }}><span style={{ position: 'absolute', inset: ii, borderRadius: '50%', background: ic }} /></span>
}

interface Data { list: Eclipse[]; now: number; name: string; known: boolean; lib: InterpLib; natalHouse: ((lon: number) => number) | null }

export function Eclipses() {
  const [d, setD] = useState<Data | null>(null)
  const [flt, setFlt] = useState<'all' | 'sun' | 'moon' | 'hit'>('all')
  const [op, setOp] = useState(-1)
  useEffect(() => {
    ;(async () => {
      const [swe, lib, me] = await Promise.all([getBrowserSwe(), loadLib(), getMe()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const natal = me ? computeChart(swe, birthInput(me)) : null
      const known = !!me && timeKnown(me)
      const end = swe.julday(tp(now).y + 3, 1, 1, -7)
      setD({ list: eclipses(swe, natal, known, now - HALF, end), now, name: me?.name ?? '', known, lib, natalHouse: natal && known ? (l) => natal.house(l) : null })
    })().catch(() => {})
  }, [])

  const body = (k: string) => { const s = d ? text(d.lib, 'eclipse', k) : null; return s ? splitTitle(s).body : '' }
  const act = d ? d.list.filter((e) => e.jd <= d.now) : []
  const up = d ? d.list.filter((e) => e.jd > d.now) : []
  const next = up[0]
  const pass = (e: Eclipse, k: string) => k === 'all' || (k === 'sun' && e.sun) || (k === 'moon' && !e.sun) || (k === 'hit' && e.hits.length > 0)
  const vis = up.filter((e) => pass(e, flt))
  const years: { y: number; rows: Eclipse[] }[] = []
  vis.forEach((e) => { const y = tp(e.jd).y + 543; let g = years[years.length - 1]; if (!g || g.y !== y) years.push((g = { y, rows: [] })); g.rows.push(e) })
  // แกนอุปราคา: กลุ่มต่อเนื่องที่อยู่แกนราศีเดียวกัน
  // จัดชุดตามแกนราศีของสุริยุปราคา (ตามแนวโหนด) แล้วรวมจันทรุปราคาในช่วงเดียวกันที่ตกแกนเดียวกัน
  const axes: { list: Eclipse[]; ax: number }[] = []
  for (const e of [...act, ...up].filter((x) => x.sun)) { const ax = Math.floor(e.lon / 30) % 6; const g = axes[axes.length - 1]; if (g && g.ax === ax) g.list.push(e); else axes.push({ ax, list: [e] }) }
  for (const g of axes) {
    const a = g.list[0]!.jd - 20, b = g.list[g.list.length - 1]!.jd + 20
    g.list = [...act, ...up].filter((e) => e.jd >= a && e.jd <= b && (e.sun ? Math.floor(e.lon / 30) % 6 === g.ax : true))
  }
  const curAx = axes.findIndex((g) => g.list.some((e) => e.jd > (d?.now ?? 0)))
  const shownAx = curAx >= 0 ? axes.slice(curAx, curAx + 2) : []
  const intro: [string, string][] = [['คืออะไร', 'สุริยุปราคาและจันทรุปราคาที่จะเกิด ปีละ 4–6 ครั้ง ตกตามแนวจุดโหนด (Nodes) ของดวงจันทร์'], ['ใช้ดู', 'ดูว่าอุปราคาครั้งไหนตกเรือนใด และไปแตะดาวในชาร์ตเราหรือไม่'], ['ทำไมสำคัญ', 'อุปราคาที่แตะดาวหรือมุมสำคัญ มักเป็นจุดเปลี่ยนที่ส่งผลนาน 6 เดือนถึงหลายปี']]
  const range = d && d.list.length ? (() => { const a = tp(d.list[0]!.jd), b = tp(d.list[d.list.length - 1]!.jd); return `${MS[a.mo - 1]} ${a.y + 543} – ${MS[b.mo - 1]} ${b.y + 543}` })() : ''
  const hit = (e: Eclipse) => e.level > 1
  const FL: ['all' | 'sun' | 'moon' | 'hit', string, string][] = [['all', 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z', 'ทั้งหมด'], ['sun', 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2', 'สุริยุปราคา'], ['moon', 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z', 'จันทรุปราคา'], ['hit', 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6', 'ผลแรง']]

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `${d.name ? `ชาร์ตของ ${d.name} · ` : ''}${range}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>สุริยุปราคา จันทรุปราคา</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Eclipses)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          {d && act.length > 0 && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>ยังมีผลอยู่ตอนนี้</span><span class="lbl">อุปราคาที่เกิดไปแล้ว แต่ผลยังค่อยๆ ปรากฏราว 6 เดือน</span></div>
              {act.map((e) => {
                const pc = Math.min(100, Math.round(((d.now - e.jd) / HALF) * 100)), endP = tp(e.jd + HALF), st = tp(e.jd)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '16px', border: `1px solid ${hit(e) ? 'rgba(255,138,101,.40)' : 'rgba(255,255,255,.10)'}`, background: hit(e) ? 'rgba(255,138,101,.07)' : 'rgba(255,255,255,.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{icon(e, 30)}<span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{title(e)}</span><span class="lbl">{when(e)} · ราศี{pos(e)}{e.house ? ` · เรือน ${e.house}` : ''}</span></span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, gap: '8px' }}><span style={{ color: hit(e) ? '#FFB08A' : '#C9CEDC' }}>{LT[e.level]}</span><span style={{ color: '#9AA1B5', fontWeight: 500, textAlign: 'right' }}>{e.hits.length ? hitS(e) : 'ไม่แตะดาวกำเนิด'}</span></div>
                    <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pc}%`, borderRadius: '4px', background: 'linear-gradient(90deg,#8A90A3,#B9A6FF)' }} /></div>
                    <div class="lbl" style={{ display: 'flex', justifyContent: 'space-between' }}><span>เกิด {st.d} {MS[st.mo - 1]}</span><span>ผ่านมา {pc}% · ผลค่อยๆ หมดราว {MS[endP.mo - 1]} {endP.y + 543}</span></div>
                    {e.house && <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{body(`${e.sun ? 'sun' : 'moon'}${e.house}`)}</span>}
                  </div>
                )
              })}
            </div>
          )}

          {d && next && (() => {
            const days = Math.round(next.jd - d.now)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(40,30,50,.95),rgba(255,138,101,.22) 60%,rgba(138,92,255,.22))', border: '1px solid rgba(255,190,160,.30)' }}>
                <span style={{ fontSize: '12px', color: '#FFD0BA' }}>อุปราคาครั้งถัดไป · อีก {Math.floor(days / 30)} เดือน {days % 30} วัน</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {next.sun ? <span style={{ flex: 'none', position: 'relative', width: '76px', height: '76px', borderRadius: '50%', background: '#FFC46B', boxShadow: '0 0 28px rgba(255,196,107,.55)' }}><span style={{ position: 'absolute', inset: next.kind === 'annular' ? '7px' : '3px', borderRadius: '50%', background: '#0B0C12' }} /></span> : icon(next, 76)}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}><span style={{ fontSize: '19px', fontWeight: 600, lineHeight: 1.35 }}>{title(next)}</span><span style={{ fontSize: '13px', color: '#E6E9F2' }}>{when(next)}</span><span style={{ fontSize: '13px', color: '#E6E9F2' }}>ราศี{pos(next)}{next.house ? ` · เรือน ${next.house} ของคุณ` : ''}</span></div>
                </div>
                {next.hits.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{next.hits.map((h) => <span class="chip" style={{ height: '22px', padding: '0 8px', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', fontSize: '11.5px', fontWeight: 600, background: 'rgba(255,176,138,.18)', color: '#FFD0BA' }}>{h.type === '0' ? 'กุม' : 'เล็ง'}{['A', 'C'].includes(h.p) ? '' : 'ดาว'}{NAME[h.p]}กำเนิด {h.orb.toFixed(1)}°</span>)}</div>}
                {(next.house || next.hits.length > 0) && (
                  <details class="xd" style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: '10px' }}>
                    <summary style={{ listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', fontWeight: 600, color: '#FFD0BA', cursor: 'pointer' }}>จะเกิดอะไร<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', fontSize: '13px', lineHeight: 1.6, color: '#E6E9F2' }}>
                      {next.house && <div><b style={{ color: '#FFD0BA' }}>เรือน {next.house}</b><br />{body(`${next.sun ? 'sun' : 'moon'}${next.house}`)}</div>}
                      {next.hits.map((h) => <div><b style={{ color: '#FFD0BA' }}>{h.type === '0' ? 'กุม' : 'เล็ง'}{NAME[h.p]}กำเนิด</b><br />{body(`hit${h.p}`)}</div>)}
                      <div><b style={{ color: '#FFD0BA' }}>ระดับผล</b><br />{body(`level${next.level}`)}</div>
                    </div>
                  </details>
                )}
              </div>
            )
          })()}

          {d?.natalHouse && shownAx.length > 0 && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>แกนอุปราคาในชาร์ตคุณ</span><span style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#C9CEDC' }}>อุปราคามาเป็นคู่ ตกสองฝั่งตรงข้ามของชาร์ตเสมอ เหมือนตาชั่ง 2 ข้าง ชีวิตช่วงนั้นจะถูกดึงให้หาสมดุลระหว่าง 2 เรื่องนี้</span></div>
              {shownAx.map((g, k) => {
                const first = g.list.find((e) => e.sun)!, s1 = Math.floor(first.lon / 30), s2 = (s1 + 6) % 12
                const hs = (s: number) => { const xs = [...new Set(g.list.filter((e) => Math.floor(e.lon / 30) === s && e.house).map((e) => e.house!))].sort((a, b) => a - b); return xs.length ? xs : [d.natalHouse!(s * 30 + 15)] }
                const h1 = hs(s1), h2 = hs(s2)
                const a = tp(first.jd), b = tp(g.list[g.list.length - 1]!.jd)
                const cur = k === 0 && g.list.some((e) => e.jd <= d.now)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', borderRadius: '16px', background: cur ? 'rgba(255,138,101,.06)' : 'rgba(255,255,255,.03)', border: `1px solid ${cur ? 'rgba(255,138,101,.35)' : 'rgba(255,255,255,.10)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13.5px', fontWeight: 600 }}>ชุดที่ {k + 1} · {cur ? `ตอนนี้ – ${MS[b.mo - 1]} ${b.y + 543}` : a.y === b.y && a.mo === b.mo ? `เริ่ม ${MS[a.mo - 1]} ${a.y + 543}` : `${MS[a.mo - 1]} ${a.y + 543} – ${MS[b.mo - 1]} ${b.y + 543}`}</span><span style={{ height: '22px', padding: '0 8px', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', fontSize: '11.5px', fontWeight: 600, background: 'rgba(255,255,255,.08)', color: '#C9CEDC' }}>{cur ? 'กำลังมีผล' : 'กำลังจะมา'}</span></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 28px minmax(0,1fr)', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px', borderRadius: '12px', background: 'rgba(255,196,107,.12)' }}><span style={{ fontSize: '11px', color: '#FFD9A0' }}>ราศี{SIGN_TH[s1]}</span><b style={{ fontSize: '13px' }}>เรือน {h1.join('–')}</b><span style={{ fontSize: '12px', lineHeight: 1.45, color: '#DCE0EA' }}>{h1.map((h) => HOUSE_TOPIC[h]).join(' · ')}</span></div>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA1B5' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3" /></svg></span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px', borderRadius: '12px', background: 'rgba(127,184,255,.12)' }}><span style={{ fontSize: '11px', color: '#B5D6FF' }}>ราศี{SIGN_TH[s2]}</span><b style={{ fontSize: '13px' }}>เรือน {h2.join('–')}</b><span style={{ fontSize: '12px', lineHeight: 1.45, color: '#DCE0EA' }}>{h2.map((h) => HOUSE_TOPIC[h]).join(' · ')}</span></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {d && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '6px' }}>
                {FL.map(([k, ip, t]) => { const on = k === flt; return <button onClick={() => { setFlt(k); setOp(-1) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px', borderRadius: '14px', border: `1px solid ${on ? '#B9A6FF' : 'rgba(255,255,255,.10)'}`, background: on ? 'rgba(185,166,255,.18)' : 'rgba(255,255,255,.03)', color: '#F2F4FA', font: '500 11.5px var(--font)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d={ip} /></svg>{t}<span style={{ fontSize: '11px', color: '#9AA1B5' }}>{up.filter((e) => pass(e, k)).length} ครั้ง</span></button> })}
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11.5px', color: '#C9CEDC', padding: '0 2px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF8A65' }} />ผลแรง · แตะดาวในชาร์ต (แถบ 2–3 ขีด)</span><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #6B7186', boxSizing: 'border-box' }} />ผลเบา · ตามธีมเรือน</span></div>
              {years.map((y) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, padding: '0 0 8px 2px' }}>พ.ศ. {y.y}</span>
                  {y.rows.map((e) => {
                    const i = d.list.indexOf(e), open = op === i, hot = hit(e), p = tp(e.jd)
                    const on = '#FF8A65', off = 'rgba(255,255,255,.10)'
                    const vt = e.sun ? (e.vis === 'yes' ? 'เห็นในไทย' : 'ไม่เห็นในไทย') : e.vis === 'yes' ? 'เห็นในไทย' : e.vis === 'low' ? 'เห็นได้ต่ำมากใกล้ขอบฟ้า' : 'ไม่เห็นในไทย'
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '46px minmax(0,1fr)' }}>
                        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', paddingTop: '14px' }}><span style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', marginLeft: '-1px', background: 'rgba(255,255,255,.10)' }} /><span style={{ position: 'relative', width: '40px', height: '40px', boxSizing: 'border-box', borderRadius: '50%', background: hot ? 'rgba(255,138,101,.22)' : '#12131A', border: `2px solid ${hot ? '#FF8A65' : '#6B7186'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.05 }}><b style={{ fontSize: '13px' }}>{p.d}</b><span style={{ fontSize: '9.5px', color: '#C9CEDC' }}>{MS[p.mo - 1]}</span></span></div>
                        <button onClick={() => setOp(open ? -1 : i)} aria-expanded={open} style={{ margin: '6px 0 10px', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '18px', border: `1px solid ${hot ? 'rgba(255,138,101,.40)' : 'rgba(255,255,255,.10)'}`, background: hot ? 'rgba(255,138,101,.07)' : 'rgba(255,255,255,.04)', color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>{icon(e, 34)}<span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}><span style={{ fontSize: '14px', fontWeight: 600 }}>{title(e)}</span><span class="lbl">{hhmm(p.hh, p.mi)} น. · ราศี{pos(e)}{e.house ? ` · เรือน ${e.house}` : ''}</span></span></div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}><span style={{ color: hot ? '#FFB08A' : '#C9CEDC' }}>{LT[e.level]}</span><span style={{ fontWeight: 500, padding: '0 6px', borderRadius: '6px', background: e.vis === 'yes' ? 'rgba(124,224,167,.16)' : 'transparent', color: e.vis === 'yes' ? '#9FEAC0' : '#9AA1B5' }}>{vt}</span></div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '3px' }}><span style={{ height: '5px', borderRadius: '3px', background: hot ? on : '#8A90A3' }} /><span style={{ height: '5px', borderRadius: '3px', background: e.level >= 2 ? on : off }} /><span style={{ height: '5px', borderRadius: '3px', background: e.level >= 3 ? on : off }} /></div>
                            <span class="lbl">{hot ? `แตะ ${hitS(e)}` : `ไม่แตะดาวกำเนิด${e.house ? ` กระตุ้นเรื่องของเรือน ${e.house} แบบเบาๆ` : ''}`}</span>
                          </div>
                          {open && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,.04)', fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>
                              {e.house && <span><b style={{ color: '#F2F4FA' }}>เรือน {e.house}:</b> {body(`${e.sun ? 'sun' : 'moon'}${e.house}`)}</span>}
                              {e.hits.map((h) => <span><b style={{ color: '#FFD0BA' }}>{h.type === '0' ? 'กุม' : 'เล็ง'}{['A', 'C'].includes(h.p) ? '' : 'ดาว'}{NAME[h.p]}กำเนิด:</b> {body(`hit${h.p}`)}</span>)}
                              <span class="lbl">{e.sun ? 'สุริยุปราคาเกิดตอนจันทร์ดับ เป็นพลังของการเริ่มต้นใหม่ที่เข้มข้น ผลมักค่อยๆ ปรากฏในช่วง 6 เดือนถัดไป' : 'จันทรุปราคาเกิดตอนจันทร์เต็ม เป็นพลังของการปิดฉาก เห็นผล หรือปล่อยเรื่องเดิมออกไป'}</span>
                            </div>
                          )}
                          <span style={{ alignSelf: 'center', margin: '2px auto 0', display: 'flex', color: '#9AA1B5' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }}><path d="m6 9 6 6 6-6" /></svg></span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
          <span class="lbl">คำนวณด้วย Swiss Ephemeris เวลาไทย · ตรวจกับ astro-seek แล้ว ชนิด วันเวลา และองศาตรงทุกครั้ง · ระดับผล: เบา = ไม่แตะดาว มีผลตามธีมเรือน / แรง = ห่างดาวกำเนิดไม่เกิน 5° (กุมหรือเล็ง) / แรงมาก = ห่างไม่เกิน 2° หรือแตะดวงอาทิตย์ ดวงจันทร์ไม่เกิน 3° · การมองเห็นคิดที่กรุงเทพฯ</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
