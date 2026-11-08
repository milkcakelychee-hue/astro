import { Rich } from '../ui/rich.tsx'
// หน้า "ตัวตนฉันเติบโตไปทางไหน" — ตาม design/Growth.dc.html · 3 แท็บ: โปรเกรส / Solar Arc / Primary Directions
// [dev] #/growth?at=2026-11-04T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { computeChart, mod, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { pdAspect, primaryDirections, progEvents, progJd, saEvents, solarArc, YEAR, type GEvent } from '../engine/growth.ts'
import { bodyAt, dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { ASPECT_CODE, splitTitle, text, type InterpLib, loadLib } from '../lib/interp.ts'
import { PT_TH, SIGN_GLYPH, SIGN_TH, glyph } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(143,212,122,.26),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(31,165,135,.28),transparent 70%),radial-gradient(500px 420px at 90% 1400px,rgba(138,92,255,.22),transparent 70%),#06070D'
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const AS: Record<AspectType | 'i', [string, string, string]> = { '0': ['☌︎', '#F3D46E', 'กุม'], '6': ['⚹︎', '#7FB8FF', 'โยค'], '4': ['□︎', '#FFB08A', 'ฉาก'], '3': ['△︎', '#7FE3C0', 'ตรีโกณ'], '8': ['☍︎', '#FF8A8A', 'เล็ง'], i: ['→', '#C9F2E3', 'เข้า'] }
const NAME: Partial<Record<Pt, string>> = { ...PT_TH, n: 'โหนดเหนือ', A: 'ลัคนา', C: 'กลางฟ้า' }
const TABS: [string, string, string][] = [
  ['โปรเกรส', 'Progressions', '1 วันหลังเกิด = 1 ปีของชีวิต ดาวในชาร์ตโปรเกรสบอกว่าภายในใจคุณเติบโตไปถึงไหน ดวงจันทร์โปรเกรสเปลี่ยนราศีทุก ~2.5 ปี เป็นนาฬิกาอารมณ์ของชีวิต'],
  ['โซลาร์อาร์ก', 'Solar Arc', 'ทุกดาวในชาร์ตเกิดเลื่อนไปเท่ากัน ประมาณ 1° ต่อปี เหมาะดูปีที่จะเกิดเหตุการณ์ภายนอกชัด ๆ'],
  ['ปฐมภูมิ', 'Primary', 'วิธีโบราณที่ใช้การหมุนของโลก แม่นเรื่องจังหวะ แต่ต้องรู้เวลาเกิดแม่นมาก'],
]
const NOW_PTS: [Pt, string][] = [['S', '#F3D46E'], ['M', '#DCE3F5'], ['m', '#B5D6FF'], ['V', '#FF8FB1'], ['a', '#FF7A59']]
const sgDeg = (lon: number) => `${SIGN_TH[Math.floor(mod(lon, 360) / 30)]} ${Math.floor(mod(lon, 30))}°`
const sgDegMin = (lon: number) => { const m = Math.floor(mod(lon, 30) * 60); return `${SIGN_TH[Math.floor(mod(lon, 360) / 30)]} ${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′` }
const tp = (jd: number) => thaiParts(dateOfJd(jd))
const body = (lib: InterpLib, cat: 'direction' | 'return', k: string) => { const s = text(lib, cat, k); return s ? splitTitle(s) : null }

interface Ev { jd: number; g1: string; g2: string; k: AspectType | 'i'; t: string; d: string }
interface Data { name: string; known: boolean; natal: Chart; now: number; birthJd: number; lib: InterpLib; prog: GEvent[]; sa: GEvent[]; arc: number; pd: Ev[]; progLon: Partial<Record<Pt, number>>; pmReturn: number | null }

export function Growth() {
  const [d, setD] = useState<Data | null>(null)
  const [tab, setTab] = useState(0)
  const [ev, setEv] = useState(-1)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) return
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const inp = birthInput(me), known = timeKnown(me)
      const natal = computeChart(swe, inp)
      const end = now + 5 * YEAR
      const pj = progJd(natal, now)
      const progLon = Object.fromEntries(NOW_PTS.map(([p]) => [p, bodyAt(swe, pj, p).lon]))
      // จันทร์โปรเกรสกลับที่เดิมภายใน 1 ปีที่ผ่านมา
      const back = progEvents(swe, natal, now - YEAR, now, false).find((e) => e.a === 'M' && e.b === 'M' && e.type === '0')
      const ageNow = (now - natal.jd) / YEAR
      const pdList: Ev[] = []
      if (known) {
        const seen = new Set<string>()
        for (const x of primaryDirections(swe, natal, inp.lat, inp.lon, ageNow + 8)) {
          if (x.age < ageNow - 1) continue
          const a = pdAspect(x)
          const key = `${x.p}${a.type}${a.to}${x.dir}${x.age.toFixed(2)}`
          if (seen.has(key)) continue
          seen.add(key)
          const viaOk = a.type === '8' ? a.via !== null : a.via === null
          if (!viaOk) { seen.delete(key); continue }
          const to = a.to === 'A' ? 'ลัคนา' : 'กลางฟ้า'
          const t = `${NAME[x.p]}${AS[a.type][2]}${to}${a.via ? ` = ${NAME[x.p]}แตะ ${a.via}` : ''} (${x.dir})`
          pdList.push({ jd: natal.jd + x.age * YEAR, g1: glyph(x.p), g2: a.to === 'A' ? 'AC' : 'MC', k: a.type, t, d: body(lib, 'direction', `pd${x.p}${ASPECT_CODE[a.type]}${a.to}`)?.body ?? '' })
        }
      }
      setD({
        name: me.name, known, natal, now, birthJd: natal.jd, lib, progLon, pmReturn: back?.jd ?? null,
        prog: progEvents(swe, natal, now, end, known),
        sa: saEvents(swe, natal, now - 30, end, known).filter((e) => !(['A', 'C'].includes(e.a) && ['A', 'C'].includes(e.b!))),
        arc: solarArc(swe, natal, now), pd: pdList,
      })
    })().catch(() => {})
  }, [])

  const toEv = (e: GEvent, kind: 'pr' | 'sa'): Ev => {
    if (e.kind === 'ingress') {
      const t = `${NAME[e.a]}โปรเกรสเข้าราศี${SIGN_TH[e.sign!]}`
      return { jd: e.jd, g1: glyph(e.a), g2: SIGN_GLYPH[e.sign!]!, k: 'i', t, d: d && (e.a === 'M' || e.a === 'S') ? body(d.lib, 'return', `${e.a === 'M' ? 'pm' : 'ps'}_sign${e.sign}`)?.body ?? '' : '' }
    }
    const L = d ? body(d.lib, 'direction', `${kind}${e.a}${ASPECT_CODE[e.type!]}${e.b}`) : null
    const S = d ? text(d.lib, 'direction_story', `${kind}${e.a}${ASPECT_CODE[e.type!]}${e.b}`) : null
    const t = L?.title || `${NAME[e.a]} (${kind === 'pr' ? 'โปรเกรส' : 'Solar Arc'}) ${AS[e.type!][2]}${NAME[e.b!]}เดิม`
    return { jd: e.jd, g1: glyph(e.a), g2: glyph(e.b!), k: e.type!, t, d: S ?? L?.body ?? '' }
  }
  const list: Ev[] = !d ? [] : tab === 0 ? d.prog.map((e) => toEv(e, 'pr')) : tab === 1 ? d.sa.map((e) => toEv(e, 'sa')) : d.pd
  const years: { y: number; items: { e: Ev; i: number }[] }[] = []
  list.forEach((e, i) => { const y = tp(e.jd).y + 543; let g = years[years.length - 1]; if (!g || g.y !== y) years.push((g = { y, items: [] })); g.items.push({ e, i }) })
  const age = d ? (d.now - d.birthJd) / YEAR : 0
  const nowP = d ? tp(d.now) : null
  const intro: [string, string][] = [['คืออะไร', 'การเติบโตภายในตามอายุ จาก 3 วิธี: Progressions, Solar Arc และ Primary Directions'], ['ใช้ดู', 'ดูช่วงชีวิตที่ตัวตน ความคิด หรือเป้าหมายเปลี่ยนไปอย่างลึกซึ้ง'], ['ทำไมสำคัญ', 'เป็นการเปลี่ยนแปลงช้าๆ จากข้างใน ต่างจากดาวจรที่เป็นเหตุการณ์จากภายนอก']]
  const mini = (l: string, v: string, s?: string) => <div style={{ padding: '10px', borderRadius: '14px', background: 'rgba(6,7,13,.40)', display: 'flex', flexDirection: 'column', gap: '2px' }}><span class="lbl" style={{ color: '#C9CEDC' }}>{l}</span><span style={{ fontSize: s === undefined ? '15px' : '13px', fontWeight: 600 }}>{v}</span>{s && <span class="lbl">{s}</span>}</div>

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `ชาร์ตของ ${d.name} · อายุ ${Math.floor(age)} ปี ${Math.floor((age % 1) * 12)} เดือน` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ตัวตนฉันเติบโตไปทางไหน</h1>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.6, marginTop: '4px' }}>ชาร์ตเกิดไม่เปลี่ยน แต่ตัวตนค่อย ๆ เติบโต วิธีเหล่านี้ขยับชาร์ตไปตามอายุ เพื่อดูว่าตอนนี้คุณอยู่ช่วงไหนของชีวิต</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, x]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{x}</span></div>)}
              </div>
            </details>
          </div>

          <div role="tablist" aria-label="วิธี" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
            {TABS.map(([l, e], i) => <button role="tab" aria-selected={tab === i} class={tab === i ? 'seg on' : 'seg'} onClick={() => { setTab(i); setEv(-1) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '52px', lineHeight: 1.25 }}><span>{l}</span><span style={{ fontSize: '10.5px', opacity: 0.75 }}>{e}</span></button>)}
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', fontSize: '13px', lineHeight: 1.6, color: '#C9CEDC' }}>{TABS[tab]![2]}</div>

          {d && tab === 0 && (() => {
            const pm = d.progLon.M!, ps = Math.floor(pm / 30)
            const ph = d.known ? d.natal.house(pm) : null
            const ret = d.pmReturn
            const rp = ret ? tp(ret) : null
            return (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(31,165,135,.35),rgba(138,92,255,.30) 60%,rgba(59,107,255,.22))', border: '1px solid rgba(150,230,200,.35)' }}>
                  {ret && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#C9F2E3' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>เพิ่งเกิดขึ้น{age < 30 ? ' · ครั้งแรกในชีวิต' : ''}</span>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><span style={{ width: '50px', height: '50px', flex: 'none', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,#FFF,#C9CEDC 70%)', boxShadow: '0 0 18px rgba(220,227,245,.5)' }} /><div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>{ret ? 'จันทร์โปรเกรสกลับที่เดิม' : `จันทร์โปรเกรสในราศี${SIGN_TH[ps]}`}</span>
                    <span style={{ fontSize: '13px', color: '#C9F2E3' }}>{ret ? `(Progressed Lunar Return) · ${MS[rp!.mo - 1]} ${rp!.y + 543}` : `(Progressed Moon) · ${sgDeg(pm)}${ph ? ` · เรือน ${ph}` : ''}`}</span>
                  </div></div>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E6E9F2' }}>{body(d.lib, 'return', `pm_sign${ps}`)?.body}{ph ? ' ' + (body(d.lib, 'return', `pm_house${ph}`)?.body ?? '') : ''}</p>
                </div>
                <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>ตัวตนของคุณตอนนี้</span><span class="lbl">เทียบตำแหน่งตอนเกิด → ตอนนี้</span></div>
                  {NOW_PTS.map(([p, col]) => {
                    const a = d.natal.pos[p].lon, b = d.progLon[p]!
                    const sa = Math.floor(a / 30), sb = Math.floor(b / 30)
                    const nx = d.prog.find((e) => e.kind === 'ingress' && e.a === p)
                    const m = nx ? `ใกล้เปลี่ยนเข้าราศี${SIGN_TH[nx.sign!]} ${MS[tp(nx.jd).mo - 1]} ${tp(nx.jd).y + 543}` : sa !== sb ? `เปลี่ยนจากราศี${SIGN_TH[sa]} เป็นราศี${SIGN_TH[sb]}` : `ยังอยู่ราศี${SIGN_TH[sa]}เหมือนตอนเกิด`
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr)', alignItems: 'start', gap: '10px', rowGap: '6px', minHeight: '54px', borderTop: '1px solid rgba(255,255,255,.06)', padding: '10px 0' }}>
                        <span style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: col, background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.12)', gridRow: 1 }}>{glyph(p)}</span>
                        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, minWidth: 0 }}><span style={{ fontSize: '14px', fontWeight: 600 }}>{NAME[p]}โปรเกรส</span><span class="lbl">{m}</span></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', gridColumn: 2, flexWrap: 'wrap' }}><span style={{ color: '#9AA1B5' }}>{sgDeg(a)}</span><span style={{ color: '#9AA1B5' }}>→</span><b style={{ fontWeight: 600 }}>{sgDeg(b)}</b></span>
                      </div>
                    )
                  })}
                </div>
              </>
            )
          })()}

          {d && tab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(243,212,110,.25),rgba(255,122,89,.20) 55%,rgba(138,92,255,.25))', border: '1px solid rgba(243,212,110,.35)' }}>
              <span style={{ fontSize: '12px', color: '#FFE9A8', fontWeight: 600 }}>ระยะที่ทุกดาวขยับไปแล้ว (Solar Arc)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}><span style={{ fontSize: '38px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(d.arc)}°{String(Math.floor((d.arc % 1) * 60)).padStart(2, '0')}′</span><span style={{ fontSize: '13px', color: '#E6E9F2' }}>≈ 1° ต่อ 1 ปีของชีวิต</span></div>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E6E9F2' }}>ทุกดาวในชาร์ตเกิดเลื่อนไปข้างหน้าเท่ากัน เมื่อดาวที่เลื่อนแล้วไปแตะจุดสำคัญในชาร์ตเดิม เช่น ลัคนา จะเป็นปีที่เกิดเหตุการณ์เด่นในเรื่องนั้น</p>
              {d.known && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px' }}>{mini('ลัคนาเลื่อนไปอยู่', sgDegMin(d.natal.pos.A.lon + d.arc))}{mini('กลางฟ้าเลื่อนไปอยู่', sgDegMin(d.natal.pos.C.lon + d.arc))}</div>}
            </div>
          )}

          {d && tab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(127,184,255,.28),rgba(138,92,255,.28) 55%,rgba(31,165,135,.22))', border: '1px solid rgba(150,180,255,.35)' }}>
              <span style={{ fontSize: '12px', color: '#C8D3FF', fontWeight: 600 }}>ทิศทางปฐมภูมิ (Primary Directions)</span>
              <span style={{ fontSize: '17px', fontWeight: 600, lineHeight: 1.4 }}>ดาวหมุนตามโลกไปแตะลัคนาและกลางฟ้า</span>
              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: '#E6E9F2' }}>เมื่อดาวในชาร์ตเกิด (หรือจุดที่ทำมุมกับดาว) หมุนไปถึงลัคนาหรือกลางฟ้า จะเป็นปีที่เรื่องของดาวนั้นเด่นขึ้นมาในชีวิต วิธีนี้ไวต่อเวลาเกิดมาก เวลาเกิดคลาด 4 นาที = ปีคลาด ~1 ปี</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px' }}>{mini('วิธีคำนวณ', 'Placidus semi-arc', 'แบบราศี (Zodiacal)')}{mini('กุญแจเวลา', 'Ptolemy', '1° = 1 ปี')}</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}><span style={{ height: '24px', padding: '0 9px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', fontSize: '11.5px', fontWeight: 600, color: '#7FE3C0', background: 'rgba(79,209,165,.16)' }}>D = ตามทิศ (Direct)</span><span style={{ height: '24px', padding: '0 9px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', fontSize: '11.5px', fontWeight: 600, color: '#B5D6FF', background: 'rgba(127,184,255,.16)' }}>C = สวนทิศ (Converse)</span></div>
              {!d.known && <span style={{ fontSize: '13px', color: '#FFD9A8' }}>ต้องมีเวลาเกิดจึงจะคำนวณวิธีนี้ได้</span>}
            </div>
          )}

          {d && nowP && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{['เหตุการณ์ในชาร์ตโปรเกรส 5 ปีข้างหน้า', 'ดาวที่เลื่อนไปแตะจุดสำคัญ 5 ปีข้างหน้า', `ดาวที่หมุนไปแตะลัคนา/กลางฟ้า ช่วงปี ${nowP.y + 543}–${nowP.y + 551}`][tab]}</span>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', paddingLeft: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px' }}><span style={{ flex: 'none', width: '22px', display: 'flex', justifyContent: 'center' }}><span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#B9A6FF', boxShadow: '0 0 0 4px rgba(185,166,255,.25),0 0 14px #B9A6FF' }} /></span><span style={{ fontSize: '13px', fontWeight: 600, color: '#D6CEFF' }}>ตอนนี้ · {MS[nowP.mo - 1]} {nowP.y + 543} · อายุ {Math.floor(age)}</span></div>
                {years.map((y) => (
                  <div style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span style={{ flex: 1, width: '2px', background: 'linear-gradient(180deg,rgba(185,166,255,.55),rgba(111,224,192,.35))' }} /></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '18px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}><span style={{ fontSize: '20px', fontWeight: 700 }}>พ.ศ. {y.y}</span><span class="lbl">อายุ {y.y - 543 - (tp(d.birthJd).y)}</span></div>
                      {y.items.map(({ e, i }) => {
                        const on = ev === i, c = AS[e.k][1]
                        return (
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '-28px', top: '16px', width: '10px', height: '10px', borderRadius: '50%', background: c, boxShadow: '0 0 0 3px #06070D' }} />
                            <button onClick={() => setEv(on ? -1 : i)} aria-expanded={on} disabled={!e.d} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '12px 14px', boxSizing: 'border-box', borderRadius: '16px', background: on ? 'rgba(185,166,255,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${on ? 'rgba(185,166,255,.55)' : 'rgba(255,255,255,.08)'}`, color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                                <span style={{ flex: 'none', padding: '3px 9px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: c, background: 'rgba(255,255,255,.06)', border: `1px solid ${c}` }}>{MS[tp(e.jd).mo - 1]}</span>
                                <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '15px' }}><span>{e.g1}</span><b style={{ color: c }}>{AS[e.k][0]}</b><span>{e.g2}</span></span>
                                {e.d && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9CEDC" stroke-width="2" aria-hidden="true" style={{ marginLeft: 'auto', flex: 'none', transform: on ? 'rotate(180deg)' : undefined }}><path d="m6 9 6 6 6-6" /></svg>}
                              </span>
                              <span style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.4 }}>{e.t}</span>
                              {on && <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA', padding: '10px 12px', borderRadius: '12px', background: 'rgba(6,7,13,.45)' }}>{e.d.split('\n').map((l, j) => <>{j > 0 && <br />}<Rich s={l} /></>)}</span>}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {list.length === 0 && <span class="lbl" style={{ paddingLeft: '32px' }}>ไม่มีรายการในช่วงนี้</span>}
              </div>
            </div>
          )}
          <span class="lbl">Secondary Progressions: 1 วันหลังเกิด = 1 ปีของชีวิต · Solar Arc: ทุกดาวเลื่อนเท่าดวงอาทิตย์โปรเกรส · วันที่ระบุเป็นเดือนโดยประมาณ</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
