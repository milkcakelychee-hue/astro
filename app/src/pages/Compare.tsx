// หน้า "เปรียบเทียบ" — ตาม design/Compare.dc.html · เปิดจากหน้าบุคคล #/compare?a=<id>&b=<id>
import { useEffect, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { computeChart, type Chart, type Pt } from '../engine/chart.ts'
import { signOf } from '../engine/dominants.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { composite, davison, synastry, type SynAspect } from '../engine/synastry.ts'
import { REL_AVATAR, birthInput, getPerson, timeKnown, type Person } from '../data/people.ts'
import { loadLib, splitTitle, synastryKey, text, type InterpLib } from '../lib/interp.ts'
import { ASPECT_COLOR, ASPECT_GLYPH, SIGN_TH, glyph, thaiDate } from '../ui/astro-labels.ts'
import { SingleWheel, SynastryWheel, WHEEL_VARS } from '../ui/CompareWheel.tsx'
import { HelpHead, Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './compare.css'

const BG =
  'radial-gradient(520px 420px at 15% -40px,rgba(138,92,255,.45),transparent 70%),radial-gradient(520px 420px at 95% 80px,rgba(31,165,135,.38),transparent 70%),radial-gradient(500px 420px at 50% 900px,rgba(59,107,255,.22),transparent 70%),#06070D'

const NAME: Partial<Record<Pt, string>> = { S: 'อาทิตย์', M: 'จันทร์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต' }
const TN: Record<AspectType, string> = { '0': 'มุมกุมกัน (Conjunction)', '6': 'มุมเปิดโอกาส (Sextile)', '4': 'มุมท้าทาย (Square)', '3': 'มุมส่งเสริม (Trine)', '8': 'มุมตรงข้าม (Opposition)' }
const rel = (p: Person) => (p.isMe ? 'me' : p.relation)
const initial = (n: string) => Array.from(n.trim().replace(/^[เแโใไ]/, ''))[0] ?? ''
const orbTxt = (o: number) => {
  const m = Math.floor(o * 60)
  return `${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′`
}

/** หมวดภาพรวม: ดาวที่เกี่ยว (มุมที่มีดาวนั้นฝั่งใดฝั่งหนึ่ง) — ความขัดแย้ง = มุมแข็งที่มีอังคาร/เสาร์/พลูโต */
const CATS: { t: string; ic: string; bg: string; c: string; pick: (x: SynAspect) => boolean; icon: preact.ComponentChildren }[] = [
  { t: 'ความรัก', bg: 'rgba(255,122,160,.16)', c: '#FF8FB1', ic: 'V', pick: (x) => x.a === 'V' || x.b === 'V', icon: <path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z" /> },
  { t: 'การสื่อสาร', bg: 'rgba(127,184,255,.16)', c: '#7FB8FF', ic: 'm', pick: (x) => x.a === 'm' || x.b === 'm', icon: <path d="M4 5h16v11H9l-5 4z" /> },
  { t: 'อารมณ์', bg: 'rgba(111,224,192,.16)', c: '#6FE0C0', ic: 'M', pick: (x) => x.a === 'M' || x.b === 'M', icon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /> },
  { t: 'ความขัดแย้ง', bg: 'rgba(255,138,76,.16)', c: '#FF8A4C', ic: 'a', pick: (x) => (x.type === '4' || x.type === '8') && ['a', 's', 'P'].some((p) => p === x.a || p === x.b), icon: <path d="M13 2 4 14h7l-1 8 9-12h-7z" /> },
  { t: 'ระยะยาว', bg: 'rgba(243,212,110,.16)', c: '#F3D46E', ic: 's', pick: (x) => ['J', 's'].some((p) => p === x.a || p === x.b), icon: <><path d="M4 20V10l8-6 8 6v10" /><path d="M9 20v-6h6v6" /></> },
]

const SLOW = new Set<Pt>(['U', 'N', 'P'])
type GroupKey = 'harm' | 'tense' | 'conj' | 'gen'
/** มุมรุ่น = ดาวช้าทั้งสองฝั่ง (คนอายุใกล้กันมักมีเหมือนกัน) */
const groupOf = (x: SynAspect): GroupKey =>
  SLOW.has(x.a) && SLOW.has(x.b) ? 'gen' : x.type === '0' ? 'conj' : x.type === '3' || x.type === '6' ? 'harm' : 'tense'
const GROUPS: { k: GroupKey; t: string; sub: string; c: string }[] = [
  { k: 'harm', t: 'ส่งเสริมกัน', sub: '△ ⚹', c: '#4FD1A5' },
  { k: 'tense', t: 'ต้องปรับเข้าหากัน', sub: '□ ☍', c: '#FF8A4C' },
  { k: 'conj', t: 'ผูกพันแน่น (กุมกัน)', sub: '☌', c: '#F3D46E' },
  { k: 'gen', t: 'มุมรุ่น (ดาวช้า)', sub: 'คนวัยใกล้กันมักมีเหมือนกัน', c: '#9AA1B5' },
]

interface Side {
  p: Person
  chart: Chart
}
interface Data {
  A: Side
  B: Side
  lib: InterpLib
  comp: Chart
  dav: Chart
}

export function Compare() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    ;(async () => {
      const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
      const [pa, pb, swe, lib] = await Promise.all([getPerson(q.get('a') ?? ''), getPerson(q.get('b') ?? ''), getBrowserSwe(), loadLib()])
      if (!pa || !pb) throw new Error('ไม่พบข้อมูลคนที่เลือก')
      const ia = birthInput(pa)
      const ib = birthInput(pb)
      const ca = computeChart(swe, ia)
      const cb = computeChart(swe, ib)
      setData({ A: { p: pa, chart: ca }, B: { p: pb, chart: cb }, lib, comp: composite(ca, cb), dav: davison(swe, ia, ib) })
    })().catch((e: unknown) => setErr(String(e)))
  }, [])
  if (err) return <Page background={BG}><div style={{ padding: '62px 20px', color: '#FF9A9A' }}>{err}</div><TabBar active="people" /></Page>
  if (!data) return <Page background={BG}><TabBar active="people" /></Page>
  return <CompareView {...data} />
}

function CompareView({ A, B, lib, comp, dav }: Data) {
  const [sw, setSw] = useState(false)
  const [mode, setMode] = useState<'syn' | 'comp'>('syn')
  const [cm, setCm] = useState<0 | 1>(0)
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const [hl, setHl] = useState(-1)
  const [openG, setOpenG] = useState<Record<string, boolean>>({})
  const L = sw ? B : A
  const R = sw ? A : B
  const asp = synastry(L.chart, R.chart)
  const asc = timeKnown(L.p) ? L.chart.pos.A.lon : 0

  const sub = (s: Side) => {
    const k = timeKnown(s.p)
    const signs = `☉ ${SIGN_TH[signOf(s.chart.pos.S.lon)]} · ☽ ${SIGN_TH[signOf(s.chart.pos.M.lon)]} · AC ${k ? SIGN_TH[signOf(s.chart.pos.A.lon)] : '—'}`
    return s.p.isMe ? signs : `${thaiDate(s.p.y, s.p.mo, s.p.d)} · ${signs}`
  }
  /** ข้อความคลัง: แทน A/B ด้วยชื่อ */
  const meaning = (x: SynAspect) => {
    const t = text(lib, 'synastry', synastryKey(x.a, x.type, x.b))
    if (!t) return null
    return splitTitle(t).body.replace(/^แก่นเรื่อง: /, '').replace(/\bA\b/g, L.p.name).replace(/\bB\b/g, R.p.name).replace(/ของA/g, 'ของ' + L.p.name).replace(/ของB/g, 'ของ' + R.p.name)
  }
  // ผู้ใช้ขอ: อิโมจิบอกอารมณ์ของมุม แทน ↔
  const LOVE: Record<string, string> = { '0': '🔥', '6': '❤️', '3': '❤️', '4': '😢', '8': '💔' }
  const pill = (x: SynAspect) => (
    <span class="pill"><b style={{ color: ASPECT_COLOR[x.type] }}>{ASPECT_GLYPH[x.type]}</b> {NAME[x.a]} {LOVE[x.type]} {NAME[x.b]}</span>
  )
  const person = (s: Side, ring: string, tag: string, tagC: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
      <span style={{ width: '56px', height: '56px', borderRadius: '999px', background: REL_AVATAR[rel(s.p)] ?? REL_AVATAR.friend, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, boxShadow: `0 0 0 3px ${ring}` }}>{initial(s.p.name)}</span>
      <span style={{ fontSize: '15px', fontWeight: 600 }}>{s.p.name}</span>
      <span class="lbl">{sub(s)}</span>
      <span style={{ fontSize: '11px', color: tagC }}>{tag}</span>
    </div>
  )
  const pick = (i: number) => {
    setHl(i)
    // มุมที่ซ่อนอยู่ในกลุ่ม → กางกลุ่มก่อนเลื่อนไป
    setOpenG((o) => ({ ...o, [groupOf(asp[i]!)]: true }))
    setTimeout(() => document.getElementById('sx' + i)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }

  return (
    <Page background={BG}>
      <div class="pg-compare" style={WHEEL_VARS as unknown as Record<string, string>}>
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#/people" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>บุคคล
          </a>
          <span style={{ fontSize: '17px', fontWeight: 600 }}>เปรียบเทียบ</span>
          <span style={{ width: '72px' }} />
        </div>

        <div style={{ padding: '14px 20px 140px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div class="card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 48px minmax(0,1fr)', alignItems: 'center', gap: '8px', background: 'linear-gradient(120deg,rgba(138,92,255,.22),rgba(31,165,135,.20))' }}>
            {person(L, 'rgba(201,184,255,.5)', 'วงใน', '#C9B8FF')}
            <button onClick={() => { setSw(!sw); setHl(-1); setOpen({}); setOpenG({}) }} aria-label="สลับคน" style={{ width: '44px', height: '44px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(6,7,13,.5)', color: '#F2F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 7h12l-3-3M17 17H5l3 3" /></svg>
            </button>
            {person(R, 'rgba(111,224,192,.5)', 'วงนอก', '#6FE0C0')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#C9CEDC' }}>มุมมองการเปรียบเทียบ</span>
            <div role="group" aria-label="มุมมองการเปรียบเทียบ" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
              <button class={mode === 'syn' ? 'seg on' : 'seg'} onClick={() => setMode('syn')}>วงซ้อนกัน</button>
              <button class={mode === 'comp' ? 'seg on' : 'seg'} onClick={() => setMode('comp')}>ชาร์ตความสัมพันธ์</button>
            </div>
            <span class="lbl">
              {mode === 'comp'
                ? cm === 0 ? 'Composite: จุดกึ่งกลางของดาวแต่ละคู่ รวมเป็นชาร์ตเดียวของ "ความสัมพันธ์"' : 'Davison: ชาร์ตของวันเวลาและสถานที่กึ่งกลางระหว่างสองคน'
                : 'วางชาร์ตสองคนซ้อนกัน ดูว่าดาวของใครไปกระทบดาวของใคร'}
            </span>
            {mode === 'comp' && (
              <div role="group" aria-label="วิธีคำนวณชาร์ตความสัมพันธ์" style={{ display: 'flex', gap: '4px', padding: '3px', borderRadius: '12px', background: 'rgba(255,255,255,.05)', alignSelf: 'flex-start', width: '220px' }}>
                <button class={cm === 0 ? 'seg on' : 'seg'} style={{ height: '32px' }} onClick={() => setCm(0)}>Composite</button>
                <button class={cm === 1 ? 'seg on' : 'seg'} style={{ height: '32px' }} onClick={() => setCm(1)}>Davison</button>
              </div>
            )}
          </div>

          <div class="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(12,14,24,.55)' }}>
            {mode === 'syn' ? (
              <>
                <SynastryWheel inner={L.chart} outer={R.chart} asc={asc} aspects={asp} onPick={pick} label={`วงซ้อน: ${L.p.name} (วงใน) กับ ${R.p.name} (วงนอก)`} />
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px', color: '#C9CEDC' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#C9B8FF' }} />{L.p.name} (วงใน)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '10px', height: '10px', borderRadius: '999px', background: '#6FE0C0' }} />{R.p.name} (วงนอก)</span>
                </div>
              </>
            ) : (
              <SingleWheel chart={cm === 0 ? comp : dav} asc={asc} label={`ชาร์ตความสัมพันธ์ (${cm === 0 ? 'Composite' : 'Davison'})`} />
            )}
            <p style={{ margin: 0, textAlign: 'center', fontSize: '12px', color: '#9AA1B5' }}>แตะเส้นเพื่อดูว่าดาวของสองคนคุยกันอย่างไร</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <HelpHead k="relation" aria="อ่านส่วนนี้อย่างไร" head={<h2 class="h2">ภาพรวมความสัมพันธ์</h2>} />
            <span class="lbl">อธิบายเป็นเรื่อง ๆ ไม่ใช้คะแนน % เพราะความสัมพันธ์ไม่ได้วัดด้วยตัวเลขเดียว</span>
            {CATS.map((cat, ci) => {
              const xs = asp.filter(cat.pick)
              const first = xs[0] ? meaning(xs[0]) : null
              return (
                <div class="cat">
                  <div class="ch">
                    <span class="ic" style={{ background: cat.bg, color: cat.c }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">{cat.icon}</svg></span>{cat.t}
                  </div>
                  {/* ข้อความจากคลัง synastry ของมุมที่แน่นที่สุดในหมวด */}
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#DCE0EA' }}>{first ?? 'ไม่มีมุมเด่นระหว่างสองชาร์ตในเรื่องนี้ (orb ไม่เกิน 3°)'}</p>
                  {xs.length > 0 && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{xs.slice(0, 3).map(pill)}</div>}
                  {open[ci] && xs.slice(1).map((x) => <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#C9CEDC' }}>{meaning(x)}</p>)}
                  {xs.length > 1 && <button class="more" onClick={() => setOpen({ ...open, [ci]: !open[ci] })}>{open[ci] ? 'ย่อ' : 'อ่านแบบละเอียด'}</button>}
                </div>
              )
            })}
          </div>

          {/* ผู้ใช้ขอ: แบ่งตามลักษณะมุม แต่ละกลุ่มโชว์ 2 อันแน่นสุด + ดูเพิ่ม · มุมรุ่น (ดาวช้า×ดาวช้า) พับไว้ท้ายสุด */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 class="h2">มุมระหว่างสองชาร์ต</h2><span class="lbl">แน่นที่สุดก่อน</span></div>
            <span class="lbl">ตัวเลขขวา = ห่างจากมุมพอดี (Orb) ยิ่งน้อยยิ่งส่งผลชัด · แสดงเฉพาะไม่เกิน 3°</span>
            {GROUPS.map((g) => {
              const items = asp.map((x, i) => ({ x, i })).filter(({ x }) => groupOf(x) === g.k)
              if (!items.length) return null
              const isOpen = !!openG[g.k]
              const shown = g.k === 'gen' ? (isOpen ? items : []) : isOpen ? items : items.slice(0, 2)
              const more = items.length - (g.k === 'gen' ? 0 : 2)
              return (
                <div class="card" style={{ padding: '4px 14px' }}>
                  {g.k === 'gen' ? (
                    <button class="grp" onClick={() => setOpenG({ ...openG, gen: !isOpen })} aria-expanded={isOpen}>
                      <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }}>▸</span>
                      <span style={{ flex: 1 }}>{g.t} · {items.length} มุม</span><span class="lbl">{g.sub}</span>
                    </button>
                  ) : (
                    <div class="grp"><span style={{ width: '8px', height: '8px', borderRadius: '9px', background: g.c }} /><span style={{ flex: 1 }}>{g.t} · {items.length} มุม</span><span class="lbl">{g.sub}</span></div>
                  )}
                  {shown.map(({ x, i }) => (
                    <div id={'sx' + i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.06)', ...(i === hl ? { background: 'rgba(127,184,255,.10)', margin: '0 -14px', padding: '12px 14px' } : {}) }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 30px minmax(0,1fr) 44px', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '14px', fontWeight: 600, color: '#C9B8FF' }}>{glyph(x.a)} {NAME[x.a]}</span><span class="lbl">ของ {L.p.name}</span></span>
                        <span style={{ textAlign: 'center', color: ASPECT_COLOR[x.type], fontWeight: 700, fontSize: '17px' }}>{ASPECT_GLYPH[x.type]}</span>
                        <span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '14px', fontWeight: 600, color: '#6FE0C0' }}>{glyph(x.b)} {NAME[x.b]}</span><span class="lbl">ของ {R.p.name}</span></span>
                        <span class="lbl" style={{ textAlign: 'right' }}>{orbTxt(x.orb)}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: ASPECT_COLOR[x.type] }}>{TN[x.type]}</span>
                      {meaning(x) && <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{meaning(x)}</span>}
                    </div>
                  ))}
                  {g.k !== 'gen' && more > 0 && (
                    <button class="more" style={{ borderTop: '1px solid rgba(255,255,255,.06)', width: '100%', minHeight: '44px' }} onClick={() => setOpenG({ ...openG, [g.k]: !isOpen })}>
                      {isOpen ? 'ย่อ' : `ดูเพิ่ม ${more} มุม ›`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <TabBar active="people" />
    </Page>
  )
}
