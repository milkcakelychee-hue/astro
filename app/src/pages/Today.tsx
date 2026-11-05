// หน้า "วันนี้" — ตาม design/Today.dc.html
// [dev] #/today?at=2026-10-31T10:00 = จำลองเวลาไทย (ใช้เทียบกับข้อมูลตัวอย่างในดีไซน์)
import { useEffect, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { computeChart, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import {
  SKY_PTS, bodyAt, dateOfJd, dignityOf, jdOfThai, moonInfo, nextIngress, thaiParts, transitEnd, transitsNow,
  type Body, type Dignity, type Ingress, type MoonInfo, type Transit,
} from '../engine/sky.ts'
import type { Swe } from '../engine/swe.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, signKey, splitTitle, text, transitKey, type InterpLib } from '../lib/interp.ts'
import { ASPECT_COLOR, ASPECT_GLYPH, ELEMENT_COLOR, SIGN_GLYPH, SIGN_TH, fmtDeg, glyph, hhmm } from '../ui/astro-labels.ts'
import { HelpHead, Page, SECTION_HELP } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './today.css'

const BG =
  'radial-gradient(520px 420px at 80% -40px,rgba(59,107,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 240px,rgba(138,92,255,.35),transparent 70%),radial-gradient(500px 420px at 70% 900px,rgba(31,165,135,.25),transparent 70%),#06070D'

const NAME: Partial<Record<Pt, string>> = {
  S: 'อาทิตย์', M: 'จันทร์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต', n: 'ราหู',
  A: 'ลัคนา (ASC)', C: 'MC (กลางฟ้า)',
}
const VERB: Record<AspectType, string> = { '0': 'กุมกัน', '6': 'เปิดโอกาส', '4': 'ท้าทาย', '3': 'ส่งเสริม', '8': 'ตรงข้าม' }
const TN: Record<AspectType, string> = { '0': 'มุมกุมกัน (Conjunction) 0°', '6': 'มุมเปิดโอกาส (Sextile) 60°', '4': 'มุมท้าทาย (Square) 90°', '3': 'มุมส่งเสริม (Trine) 120°', '8': 'มุมตรงข้าม (Opposition) 180°' }
const DAY = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์']
const MONTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** ป้ายศักดิ์ดาว: [ชื่อเต็ม, สี, พื้น, ชื่อสั้น, คำอธิบายสั้น] — เกษตร/นิจ ตามดีไซน์ · อุจ/ประ ตามคำอธิบายท้ายตาราง */
const DG: Record<Dignity, [string, string, string, string, string]> = {
  dom: ['เกษตร (Domicile)', '#7FE3C0', 'rgba(79,209,165,.14)', 'เกษตร', 'อยู่บ้านตัวเอง ทำงานได้เต็มแรง'],
  exalt: ['อุจ (Exaltation)', '#7FE3C0', 'rgba(79,209,165,.14)', 'อุจ', 'ได้รับยกย่อง ทำงานได้ดี'],
  detr: ['ประ (Detriment)', '#FF8A8A', 'rgba(255,107,107,.14)', 'ประ', 'ดาวเสีย ทำงานได้ไม่เต็มที่'],
  fall: ['นิจ (Fall)', '#FF8A8A', 'rgba(255,107,107,.14)', 'นิจ', 'ดาวเสีย ทำงานได้ไม่เต็มที่'],
}
const bad = (d: Dignity | null) => d === 'detr' || d === 'fall'

const dmy = (jd: number) => {
  const p = thaiParts(dateOfJd(jd))
  return `${p.d} ${MON[p.mo - 1]} ${p.y + 543}`
}
const hm = (jd: number) => {
  const p = thaiParts(dateOfJd(jd))
  return hhmm(p.hh, p.mi)
}
const dayKey = (jd: number) => {
  const p = thaiParts(dateOfJd(jd))
  return p.y * 10000 + p.mo * 100 + p.d
}

interface SkyRow {
  p: Pt
  body: Body
  sign: number
  dg: Dignity | null
  ingress: Ingress | null
}
interface Data {
  jd: number
  now: Date
  moon: MoonInfo
  rows: SkyRow[]
  transits: (Transit & { endsJd: number | null })[] | null
  lib: InterpLib
}

/** ช่วงค้นวันย้ายราศี: เกิน 8 ปี = "อีกหลายปี" */
const INGRESS_DAYS = 8 * 366

function compute(swe: Swe, now: Date, natal: Chart | null, angles: boolean, lib: InterpLib): Data {
  const jd = jdOfThai(swe, now)
  const rows = SKY_PTS.map((p) => {
    const body = bodyAt(swe, jd, p)
    const sign = Math.floor(body.lon / 30)
    return { p, body, sign, dg: dignityOf(p, sign), ingress: nextIngress(swe, jd, p, p === 'M' ? 4 : INGRESS_DAYS) }
  })
  const transits = natal
    ? transitsNow(swe, jd, natal, angles).slice(0, 5).map((t) => ({ ...t, endsJd: transitEnd(swe, jd, t, natal) }))
    : null
  return { jd, now, moon: moonInfo(swe, jd), rows, transits, lib }
}

function nowFromHash(): Date {
  const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
  if (import.meta.env.DEV && at) return new Date(at + ':00+07:00')
  return new Date()
}

export function Today() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    const load = async () => {
      try {
        const [swe, lib, me] = await Promise.all([getBrowserSwe(), loadLib(), getMe()])
        const natal = me ? computeChart(swe, birthInput(me)) : null
        setData(compute(swe, nowFromHash(), natal, !!me && timeKnown(me), lib))
      } catch (e) {
        setErr(String(e))
      }
    }
    load()
    // กลับมาเปิดแอป → อัปเดตตำแหน่งดาว
    const vis = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [])

  if (err) return <Page background={BG}><div style={{ padding: '62px 20px', color: '#FF9A9A' }}>{err}</div><TabBar active="today" /></Page>
  if (!data) return <Page background={BG}><TabBar active="today" /></Page>
  return <TodayView {...data} />
}

/** ภาพดวงจันทร์ตามข้างจริง (ซีกเหนือ: ข้างขึ้นสว่างด้านขวา) */
function MoonDisc({ elong, illum }: { elong: number; illum: number }) {
  const r = 42
  const waxing = elong < 180
  const rx = r * Math.abs(Math.cos((elong * Math.PI) / 180))
  const gib = illum > 0.5
  const s1 = waxing ? 1 : 0
  const s2 = waxing ? (gib ? 1 : 0) : gib ? 0 : 1
  const d = `M42 0 A42 42 0 0 ${s1} 42 84 A${rx.toFixed(2)} 42 0 0 ${s2} 42 0Z`
  return (
    <div aria-hidden="true" style={{ width: '84px', height: '84px', flex: 'none', borderRadius: '999px', position: 'relative', overflow: 'hidden', background: '#0E1120', boxShadow: '0 0 40px rgba(200,210,255,.35)' }}>
      <svg width="84" height="84" viewBox="0 0 84 84" style={{ display: 'block' }}><path d={d} fill="#E9ECF7" /></svg>
    </div>
  )
}

/** ระยะผลของทรานซิตจากเวลาที่จะพ้น orb */
function durationChip(jd: number, end: number | null): { t: string; hot: boolean } {
  const days = end === null ? Infinity : end - jd
  if (days < 1) return { t: 'วันนี้', hot: true }
  if (days <= 2.5) return { t: `วันนี้–${Math.ceil(days)} วัน`, hot: true }
  if (days <= 10) return { t: 'ส่งผลไม่กี่วัน', hot: false }
  if (days <= 60) return { t: 'ส่งผลหลายสัปดาห์', hot: false }
  if (days <= 365) return { t: 'ส่งผลหลายเดือน', hot: false }
  return { t: 'ส่งผลหลายปี', hot: false }
}

/** "แก่นเรื่อง" ของข้อความทรานซิตในคลัง (ส่วนที่เฉพาะคู่ดาว) */
function transitLine(lib: InterpLib, t: Transit): string | null {
  const s = text(lib, 'transit', transitKey(t.t, t.type, t.n))
  if (!s) return null
  const body = splitTitle(s).body
  const [head = '', rest = ''] = body.split(' · ')[0]!.split(' — ')
  // มี "แก่นเรื่อง" เฉพาะคู่ → ใช้ส่วนนั้น · ไม่มี (ข้อความแบบประกอบ) → ใช้ส่วนผลของมุม
  return head.startsWith('แก่นเรื่อง: ') ? head.slice(12) : rest || head
}

/** จากคลัง planet_sign: คำอธิบายศักดิ์ (หลังป้าย เช่น "พลังอ่อน ต้องใช้ความพยายามมากขึ้น") และแก่นเรื่องของดาว */
function signLib(lib: InterpLib, p: Pt, sign: number): { dgDesc: string | null; theme: string | null } {
  const t = text(lib, 'planet_sign', signKey(p, sign))
  if (!t) return { dgDesc: null, theme: null }
  const body = splitTitle(t).body
  const m = /(?:เกษตร|อุจ|ประ|นิจ) \((?:Domicile|Exaltation|Detriment|Fall)\) ([^·]+)$/.exec(body)
  return { dgDesc: m ? m[1]!.trim() : null, theme: body.split(' แสดงออกแบบ')[0]!.trim() || null }
}

function TodayView({ jd, now, moon, rows, transits, lib }: Data) {
  const [sel, setSel] = useState(-1)
  const tp = thaiParts(now)
  const moonRow = rows.find((r) => r.p === 'M')!
  const ms = moonRow.sign
  const moonText = text(lib, 'moon', `sign${ms}`)
  const vocText = text(lib, 'moon', 'voc')

  const rel = (x: number) => {
    const d = dayKey(x) - dayKey(jd)
    const p = thaiParts(dateOfJd(x))
    return d === 0 ? 'วันนี้' : dayKey(x) === dayKey(jd + 1) ? 'พรุ่งนี้' : `${p.d} ${MON[p.mo - 1]}`
  }
  const vocRange = (v: { start: number; end: number }) => {
    const a = thaiParts(dateOfJd(v.start))
    const b = thaiParts(dateOfJd(v.end))
    const same = dayKey(v.start) === dayKey(v.end)
    return same
      ? `${a.d} ${MON[a.mo - 1]} ${hm(v.start)} – ${hm(v.end)} น.`
      : `${a.d} ${MON[a.mo - 1]} ${hm(v.start)} – ${b.d} ${MON[b.mo - 1]} ${hm(v.end)} น.`
  }

  const nextText = (r: SkyRow) => {
    const name = NAME[r.p]!
    if (!r.ingress) return `อยู่ราศี${SIGN_TH[r.sign]}อีกหลายปี`
    const to = SIGN_TH[r.ingress.sign]
    const when = r.p === 'M' ? `${dmy(r.ingress.jd)} เวลา ${hm(r.ingress.jd)} น.` : dmy(r.ingress.jd)
    if (bad(r.dg)) return `ตอนนี้เป็น${DG[r.dg!][0]} จะพ้นเมื่อย้ายเข้าราศี${to} ${when}`
    const retro = r.body.speed < 0 && ['m', 'V', 'a', 'J', 's'].includes(r.p)
    const nd = dignityOf(r.p, r.ingress.sign)
    const tail = bad(nd) ? ` ที่นั่น${name}จะเป็น${DG[nd!][0]} หรือดาวเสีย` : ''
    return `${retro ? 'ถอยหลังอยู่ จะ' : ''}ย้ายเข้าราศี${to} ${when}${tail}`
  }
  const debilitated = rows.filter((r) => bad(r.dg))

  const H2 = (p: { t: string; en?: string; aria: string; k: keyof typeof SECTION_HELP }) => (
    <HelpHead k={p.k} aria={p.aria} head={<h2 class="h2">{p.t}{p.en && <> <span class="lbl" style={{ fontWeight: 400 }}>({p.en})</span></>}</h2>} />
  )

  return (
    <Page background={BG}>
      <div class="pg-today" style={{ padding: '62px 20px 150px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#B9A6FF', letterSpacing: '.02em' }}>วันนี้ · {DAY[tp.wd]}</span>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
              <span style={{ fontSize: '56px', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{tp.d}</span>
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                <span style={{ fontSize: '22px' }}>{MONTH[tp.mo - 1]}</span>
                <span style={{ fontSize: '16px', color: '#C9CEDC', fontWeight: 500 }}>พ.ศ. {tp.y + 543}</span>
              </span>
            </h1>
            <span class="lbl">อัปเดตตำแหน่งดาวเมื่อ {hhmm(tp.hh, tp.mi)} น.</span>
          </div>
        </div>

        {/* ดวงจันทร์ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <H2 t="ดวงจันทร์วันนี้" en="Moon" aria="ดวงจันทร์บอกอะไร" k="moon" />
          <div class="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(140deg,rgba(59,107,255,.28),rgba(138,92,255,.20) 55%,rgba(31,165,135,.18))', borderColor: 'rgba(150,170,255,.35)' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <MoonDisc elong={moon.elong} illum={moon.illum} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '12px', color: '#C8D3FF' }}>{moon.waxing ? 'ข้างขึ้น' : 'ข้างแรม'} {moon.kham} ค่ำ · สว่าง {Math.round(moon.illum * 100)}%</span>
                <span style={{ fontSize: '20px', fontWeight: 600 }}>จันทร์ในราศี{SIGN_TH[ms]} <span style={{ color: ELEMENT_COLOR[ms % 4] }}>{SIGN_GLYPH[ms]}</span></span>
                <span style={{ fontSize: '13px', color: '#DCE0EA' }}>
                  {fmtDeg(moon.lon)}{moon.ingress && ` · ย้ายเข้า${SIGN_TH[moon.ingress.sign]} ${rel(moon.ingress.jd)} ${hm(moon.ingress.jd)} น.`}
                </span>
              </div>
            </div>
            {moonText && <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#DCE0EA' }}>{splitTitle(moonText).body}</p>}
            {moon.voc && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.40)', border: '1px solid rgba(255,255,255,.10)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3D46E" stroke-width="1.8" aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>ช่วงจันทร์ว่าง <span class="lbl">(Void of Course)</span></span>
                  <span style={{ fontSize: '13px', color: '#DCE0EA' }}>{vocRange(moon.voc)}</span>
                  {vocText && <span style={{ fontSize: '12px', color: '#9AA1B5', lineHeight: 1.5 }}>{splitTitle(vocText).body}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ทรานซิต (ต้องมีชาร์ตของฉัน) */}
        {transits && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <H2 t="ดาวตอนนี้กระทบชาร์ตคุณ" en="Transits" aria="ดาวจรคืออะไร" k="transits" />
            <span class="lbl">เรียงจากสำคัญที่สุด · ดาวเคลื่อนช้าส่งผลนานกว่า · "ห่าง" = ห่างจากมุมพอดี (Orb)</span>
            {transits.length > 0 && (
              <div class="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {transits.map((t, i) => {
                  const col = ASPECT_COLOR[t.type]
                  const dur = durationChip(jd, t.endsJd)
                  const line = transitLine(lib, t)
                  const om = Math.floor(t.orb * 60)
                  return (
                    <button class="tr" style={i ? { borderTop: '1px solid rgba(255,255,255,.06)' } : undefined}>
                      <span style={{ width: '40px', height: '40px', flex: 'none', borderRadius: '12px', background: col + '26', color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{ASPECT_GLYPH[t.type]}</span>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 600 }}>{NAME[t.t]}{t.retro ? ' (ถอยหลัง)' : ''} {VERB[t.type]} {NAME[t.n]}ของคุณ</span>
                        <span style={{ fontSize: '12px', color: col, fontWeight: 600 }}>{ASPECT_GLYPH[t.type]} {TN[t.type]}</span>
                        {line && <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.5 }}>{line}</span>}
                        <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span class="tchip" style={dur.hot ? { background: 'rgba(79,209,165,.15)', color: '#7FE3C0' } : undefined}>{dur.t}</span>
                          <span class="tchip">ห่าง {Math.floor(om / 60)}°{String(om % 60).padStart(2, '0')}′</span>
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            <a href="#/forecast" style={{ alignSelf: 'flex-start', fontSize: '14px', fontWeight: 500, textDecoration: 'none', minHeight: '44px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              ดูทั้งหมดในหน้าดวงล่วงหน้า <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </a>
          </div>
        )}

        {/* ตำแหน่งดาวตอนนี้ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <H2 t="ตำแหน่งดาวตอนนี้" aria="ตารางนี้คืออะไร" k="sky" />
          <span class="lbl">แตะดาวเพื่อดูว่าจะย้ายราศีเมื่อไหร่ (Ingress)</span>
          {debilitated.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.30)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8A8A" stroke-width="1.8" aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }}><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>ตอนนี้มีดาวเสีย {debilitated.length} ดวง</span>
                {debilitated.map((r) => (
                  // ข้อความจากคลัง planet_sign: ศักดิ์ + แก่นเรื่องของดาวที่ได้รับผล
                  (() => {
                    const L = signLib(lib, r.p, r.sign)
                    return <span style={{ fontSize: '13px', color: '#DCE0EA', lineHeight: 1.5 }}>{NAME[r.p]}ในราศี{SIGN_TH[r.sign]} เป็น{DG[r.dg!][0]} {L.dgDesc ?? DG[r.dg!][4]}{L.theme ? ` · เรื่องที่ได้รับผล: ${L.theme}` : ''}</span>
                  })()
                ))}
              </div>
            </div>
          )}
          <div class="card" style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column' }}>
            {rows.map((r, i) => {
              const open = i === sel
              const dg = r.dg ? DG[r.dg] : null
              return (
                <div style={{ display: 'flex', flexDirection: 'column', ...(open ? { background: 'rgba(255,255,255,.05)', borderRadius: '12px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)', margin: '2px 0 6px' } : {}) }}>
                  <button class="row" onClick={() => setSel(open ? -1 : i)} aria-expanded={open} style={open ? { borderTopColor: 'transparent' } : undefined}>
                    <span style={{ fontSize: '17px' }}>{glyph(r.p)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, whiteSpace: 'nowrap' }}>
                      <span>{NAME[r.p]}</span>
                      {r.body.speed < 0 && <span style={{ height: '18px', padding: '0 5px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', fontSize: '10.5px', fontWeight: 700, color: '#FF8A4C', background: 'rgba(255,138,76,.14)' }}>R</span>}
                      {dg && (
                        <span style={{ height: '18px', padding: '0 7px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, lineHeight: 1, background: dg[2], color: dg[1] }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '9px', background: dg[1] }} />{dg[3]}
                        </span>
                      )}
                    </span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDeg(r.body.lon).padStart(6, '0')} <span style={{ color: ELEMENT_COLOR[r.sign % 4] }}>{SIGN_GLYPH[r.sign]}</span> {SIGN_TH[r.sign]}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1B5" stroke-width="2" aria-hidden="true" style={open ? { transform: 'rotate(180deg)' } : undefined}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {open && (
                    // ผู้ใช้ขอ: รายละเอียดต่อเนื่องจากแถวดาวเป็นกรอบเดียว (เดิม 2 กล่องแยก)
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '2px 12px 12px 36px', fontSize: '13px', lineHeight: 1.5, color: '#DCE0EA' }}>
                      {dg && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                          <b style={{ color: dg[1], fontWeight: 600, whiteSpace: 'nowrap' }}>{dg[0]}</b><span>{signLib(lib, r.p, r.sign).dgDesc ?? dg[4]}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', ...(dg ? { paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,.08)' } : {}) }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7FB8FF" stroke-width="1.8" aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
                        <span>{nextText(r)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <span class="lbl">R = ถอยหลัง (Retrograde) · ช่วงที่ดาวถอยหลังมักเหมาะกับการทบทวน มากกว่าเริ่มใหม่</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '6px 12px', fontSize: '12px', color: '#C9CEDC', padding: '4px 2px' }}>
            <span><b style={{ color: '#7FE3C0' }}>เกษตร</b> (Domicile) อยู่บ้านตัวเอง</span>
            <span><b style={{ color: '#7FE3C0' }}>อุจ</b> (Exaltation) ได้รับยกย่อง</span>
            <span><b style={{ color: '#FF8A8A' }}>ประ</b> (Detriment) อยู่ตรงข้ามบ้าน</span>
            <span><b style={{ color: '#FF8A8A' }}>นิจ</b> (Fall) ตกต่ำ</span>
          </div>
          <span class="lbl">ประ และ นิจ คือ "ดาวเสีย" ใช้กับดาว 7 ดวงแบบดั้งเดิมเท่านั้น</span>
        </div>
      </div>
      <TabBar active="today" />
    </Page>
  )
}

