// หน้า "ไทม์ไลน์ชีวิต" — ตาม design/Timeline.dc.html
// [dev] #/timeline?at=2026-11-01T00:00 = จำลองวันนี้
import { useEffect, useMemo, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { computeChart, type Pt } from '../engine/chart.ts'
import { nextMajorEvent, type CycleEvent, type CycleKind } from '../engine/cycles.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { SPAN_PAD, timelineEvents, type TlEvent, type TlKind } from '../engine/timeline.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, splitTitle, text, transitKey, type InterpLib } from '../lib/interp.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './timeline.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 420px,rgba(31,165,135,.26),transparent 70%),radial-gradient(500px 420px at 90% 1500px,rgba(59,107,255,.22),transparent 70%),#06070D'
const V = '︎'
const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const PL: Partial<Record<Pt, [string, string, string?, string?]>> = {
  J: ['♃', 'พฤหัสบดี', '#F3D46E', 'Jupiter'], s: ['♄', 'เสาร์', '#8FD47A', 'Saturn'], U: ['♅', 'ยูเรนัส', '#7FB8FF', 'Uranus'], N: ['♆', 'เนปจูน', '#6FE0C0', 'Neptune'], P: ['♇', 'พลูโต', '#FF8FB1', 'Pluto'],
  S: ['☉', 'อาทิตย์'], M: ['☽', 'จันทร์'], m: ['☿', 'พุธ'], V: ['♀', 'ศุกร์'], a: ['♂', 'อังคาร'], A: ['AC', 'ลัคนา'], C: ['MC', 'กลางฟ้า'],
}
const AS: Partial<Record<AspectType, [string, string, string]>> = {
  '0': ['☌', '#F3D46E', 'กุม'], '4': ['□', '#FF8A4C', 'ฉาก'], '3': ['△', '#4FD1A5', 'ตรีโกณ'], '8': ['☍', '#FF6B6B', 'เล็ง'],
}
const KIND: Record<TlKind, [string, string, string]> = {
  opp: ['โอกาส', '#7FE3C0', 'rgba(79,209,165,.16)'], test: ['บททดสอบ', '#FFB08A', 'rgba(255,138,76,.16)'], change: ['เปลี่ยนแปลง', '#B5D6FF', 'rgba(127,184,255,.16)'],
}
type Flt = 'all' | 'big' | TlKind
const F: [Flt, string, string, string][] = [['all', 'ทั้งหมด', '#C9CEDC', 'M4 6h16M4 12h16M4 18h16'], ['big', 'ครั้งใหญ่', '#F3D46E', 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z'], ['opp', 'โอกาส', '#4FD1A5', 'M4 17l6-6 4 4 6-8M14 7h6v6'], ['test', 'บททดสอบ', '#FF8A4C', 'M12 3 2 20h20zM12 10v4M12 17h.01'], ['change', 'เปลี่ยนแปลง', '#7FB8FF', 'M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4']]
const HERO_TH: Record<CycleKind, string> = { return: 'กลับที่เดิม', sq1: 'ทำมุมฉากกับตำแหน่งเดิม', opp: 'อยู่ตรงข้ามตำแหน่งเดิม', sq2: 'ทำมุมฉากกับตำแหน่งเดิม' }
const HERO_EN: Record<CycleKind, string> = { return: 'Return', sq1: 'Square', opp: 'Opposition', sq2: 'Square' }
const fd = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.d} ${TH[p.mo - 1]} ${p.y + 543 - 2500}` }
const fdLong = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.d} ${TH[p.mo - 1]} ${p.y + 543}` }
/** JD ต้นปี ค.ศ. y (เวลาไทย) */
const yearJd = (swe: { julday: (y: number, m: number, d: number, h: number) => number }, y: number) => swe.julday(y, 1, 1, -7)

/** แยกข้อความคลังทรานซิต → ความหมาย / ควรทำ (ตัด "ผล…" เพราะหน้านี้แสดงช่วงที่มีผลเอง) */
function meaning(lib: InterpLib | null, e: TlEvent): [string, string] {
  if (!lib) return ['', '']
  const s = text(lib, 'transit', transitKey(e.t, e.type, e.n))
  if (!s) return ['', '']
  const parts = splitTitle(s).body.split(' · ')
  const how = parts.find((x) => x.startsWith('ควรทำ: '))?.slice(7) ?? ''
  const mean = parts.filter((x) => !x.startsWith('ควรทำ: ') && !x.startsWith('ผล')).join(' · ').replace(/^แก่นเรื่อง: /, '')
  return [mean, how]
}

interface Ctx { name: string; age: number; by: number; now: number; nowY: number; ev: TlEvent[]; hero: { e: CycleEvent; body: string } | null; y0s: number[] }

export function Timeline() {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [lib, setLib] = useState<InterpLib | null>(null)
  const [range, setRange] = useState<1 | 3 | 5>(5)
  const [flt, setFlt] = useState<Flt>('all')
  const [sel, setSel] = useState('')
  const [cy, setCy] = useState(0)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) return
      const [swe, l] = await Promise.all([getBrowserSwe(), loadLib()])
      setLib(l)
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const nowD = at ? new Date(at + ':00+07:00') : new Date()
      const now = jdOfThai(swe, nowD)
      const nat = computeChart(swe, birthInput(me))
      const t = thaiParts(nowD)
      const age = t.y - me.y - (t.mo < me.mo || (t.mo === me.mo && t.d < me.d) ? 1 : 0)
      const ev = timelineEvents(swe, nat, now - SPAN_PAD, now + 365.25 * 5, timeKnown(me))
      const he = nextMajorEvent(swe, nat, now)
      const hs = he ? text(l, 'cycle', `${he.p}_${he.kind}`) : ''
      const y0s: number[] = []
      for (let y = t.y; y <= t.y + 6; y++) y0s.push(yearJd(swe, y))
      setCtx({ name: me.name, age, by: me.y, now, nowY: t.y, ev, hero: he ? { e: he, body: hs ? splitTitle(hs).body : '' } : null, y0s })
      setCy(t.y)
    })().catch(() => {})
  }, [])

  const v = useMemo(() => {
    if (!ctx) return null
    const { now, nowY, y0s } = ctx
    const lim = now + 365.25 * range
    const span = (e: TlEvent): [number, number] => [e.passes[0] - SPAN_PAD, e.passes[e.passes.length - 1] + SPAN_PAD]
    const inYear = (e: TlEvent, y: number) => { const r = span(e); const i = y - nowY; return r[0] < y0s[i + 1] && r[1] >= y0s[i] }
    const all = ctx.ev.filter((e) => span(e)[1] >= now && e.passes.some((p) => p >= now - SPAN_PAD && p < lim))
    const shown = all.filter((e) => flt === 'all' || (flt === 'big' ? e.big : e.kind === flt))
    const ys: number[] = []
    for (let y = nowY; y <= nowY + range; y++) if (all.some((e) => inYear(e, y))) ys.push(y)
    const y = ys.includes(cy) ? cy : ys[0] ?? nowY
    const a = y0s[y - nowY], b = y0s[y - nowY + 1]
    const list = shown.filter((e) => inYear(e, y))
    const nowX = now >= a && now < b ? ((now - a) / (b - a)) * 100 : -1
    return { all, ys, y, a, b, list, nowX, span, inYear }
  }, [ctx, range, flt, cy])

  const intro: [string, string][] = [
    ['คืออะไร', 'ไทม์ไลน์เหตุการณ์ดาวจรสำคัญรายปี เช่น Saturn Return และดาววงนอกทำมุมกับชาร์ต'],
    ['ใช้ดู', 'มองภาพรวมหลายปีข้างหน้า ว่าช่วงไหนเป็นจุดเปลี่ยน'],
    ['ทำไมสำคัญ', 'ดาวช้าส่งผลยาวนานเป็นเดือนหรือปี ช่วยวางแผนชีวิตระยะยาว'],
  ]

  let heroEl = null
  if (ctx?.hero) {
    const { e, body } = ctx.hero
    const pl = PL[e.p]!
    // นับถอยหลัง ปี/เดือน/วัน ตามปฏิทิน
    const n = thaiParts(dateOfJd(ctx.now)), d = thaiParts(dateOfJd(e.jd))
    let yy = d.y - n.y, mm = d.mo - n.mo, dd = d.d - n.d
    if (dd < 0) { mm--; dd += new Date(Date.UTC(d.y, d.mo - 1, 0)).getUTCDate() }
    if (mm < 0) { yy--; mm += 12 }
    heroEl = (
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', borderRadius: '24px', overflow: 'hidden', background: 'linear-gradient(140deg,rgba(138,92,255,.45),rgba(59,107,255,.25) 55%,rgba(31,165,135,.30))', border: '1px solid rgba(170,160,255,.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ width: '52px', height: '52px', flex: 'none', borderRadius: '16px', background: 'rgba(6,7,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: pl[2] }}>{pl[0] + V}</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
            <span style={{ fontSize: '12px', color: '#D6CEFF' }}>บทใหญ่ที่สุดในช่วงนี้ · {e.nth === 1 ? 'ครั้งแรกในชีวิต' : `ครั้งที่ ${e.nth} ในชีวิต`}</span>
            <span style={{ fontSize: '19px', fontWeight: 600 }}>ดาว{pl[1]}{HERO_TH[e.kind]}</span>
            <span style={{ fontSize: '13px', color: '#C8D3FF' }}>({pl[3]} {HERO_EN[e.kind]})</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#D6CEFF' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>นับถอยหลังถึงวันตรงพอดี</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
            {([[yy, 'ปี'], [mm, 'เดือน'], [dd, 'วัน']] as const).map(([x, u]) => (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderRadius: '14px', background: 'rgba(6,7,13,.40)', lineHeight: 1.2 }}><span style={{ fontSize: '24px', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{x}</span><span class="lbl" style={{ color: '#C9CEDC' }}>{u}</span></div>
            ))}
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E6E9F2' }}>ตรงพอดี {fdLong(e.jd)} {body}</p>
      </div>
    )
  }

  return (
    <Page background={BG}>
      <div class="pg-tl">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{ctx ? `ชาร์ตของ ${ctx.name} · อายุ ${ctx.age} ปี` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600 }}>ไทม์ไลน์ชีวิต</h1>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.6 }}>ช่วงที่ดาวเคลื่อนช้า (พฤหัสบดี เสาร์ ยูเรนัส เนปจูน พลูโต) ทำมุมกับชาร์ตเกิด เป็นบทใหญ่ที่กินเวลาหลายเดือน</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, x]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{x}</span></div>)}
              </div>
            </details>
          </div>

          {heroEl}

          <div role="tablist" aria-label="ช่วงเวลา" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
            {([1, 3, 5] as const).map((r) => <button role="tab" aria-selected={range === r} class={range === r ? 'seg on' : 'seg'} onClick={() => setRange(r)}>{r} ปี</button>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: '6px' }}>
            {F.map(([k, t, c, ic]) => {
              const on = flt === k
              return <button onClick={() => setFlt(k)} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', height: '64px', padding: '0 2px', borderRadius: '14px', border: `1px solid ${on ? c : 'rgba(255,255,255,.10)'}`, background: on ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.04)', color: on ? '#F2F4FA' : '#C9CEDC', font: '500 11.5px var(--font)', whiteSpace: 'nowrap' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} stroke-width="1.8" aria-hidden="true"><path d={ic} /></svg>{t}</button>
            })}
          </div>

          {v && ctx && (
            <>
              <div style={{ display: 'flex', gap: '6px', overflow: 'hidden' }}>
                {v.ys.map((y) => {
                  const on = y === v.y
                  const cols: string[] = []
                  v.all.filter((e) => v.inYear(e, y)).forEach((e) => { const c = KIND[e.kind][1]; if (!cols.includes(c)) cols.push(c) })
                  return (
                    <button onClick={() => { setCy(y); setSel('') }} aria-pressed={on} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '8px 0', borderRadius: '14px', border: `1px solid ${on ? 'rgba(185,166,255,.6)' : 'rgba(255,255,255,.10)'}`, background: on ? 'linear-gradient(160deg,rgba(138,92,255,.45),rgba(31,165,135,.25))' : 'rgba(255,255,255,.04)', color: '#F2F4FA', fontFamily: 'inherit' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{y + 543}</span>
                      <span style={{ fontSize: '10.5px', color: '#9AA1B5' }}>อายุ {y - ctx.by}</span>
                      <span style={{ display: 'flex', gap: '2px', height: '5px', marginTop: '2px' }}>{cols.map((c) => <i style={{ width: '5px', height: '5px', borderRadius: '9px', background: c }} />)}</span>
                    </button>
                  )
                })}
              </div>

              <div class="card" style={{ padding: '14px 14px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: '17px', fontWeight: 600 }}>พ.ศ. {v.y + 543}</span><span class="lbl">{v.list.length} ช่วงที่มีผลในปีนี้</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,minmax(0,1fr))', fontSize: '10px', color: '#9AA1B5', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.08)', paddingBottom: '4px' }}>{TH.map((m) => <span>{m}</span>)}</div>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px', padding: '4px 0' }}>
                  <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${Math.max(0, v.nowX).toFixed(1)}%`, width: '2px', background: '#B9A6FF', opacity: v.nowX < 0 ? 0 : 1 }} />
                  {v.list.map((e) => {
                    const id = transitKey(e.t, e.type, e.n)
                    const r = v.span(e)
                    const bl = Math.max(0, (r[0] - v.a) / (v.b - v.a)), br = Math.min(1, (r[1] - v.a) / (v.b - v.a))
                    const k = KIND[e.kind], open = sel === id
                    return (
                      <button onClick={() => setSel(open ? '' : id)} style={{ position: 'relative', height: '24px', border: 'none', background: 'transparent', padding: 0, fontFamily: 'inherit' }}>
                        <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${(bl * 100).toFixed(1)}%`, width: `${((br - bl) * 100).toFixed(1)}%`, minWidth: '24px', borderRadius: '8px', background: open ? k[2].replace('.16', '.45') : k[2], border: `1px solid ${open ? k[1] : 'transparent'}`, display: 'flex', alignItems: 'center', gap: '3px', padding: '0 6px', boxSizing: 'border-box', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '11px', color: '#F2F4FA' }}>
                          <b style={{ color: PL[e.t]![2], fontSize: '12px' }}>{PL[e.t]![0] + V}</b><b style={{ color: AS[e.type]![1] }}>{AS[e.type]![0] + V}</b>{PL[e.n]![1]}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <span class="lbl">แถบ = ช่วงที่มีผล · เส้นม่วง = วันนี้ · แตะแถบเพื่อเปิดรายละเอียด</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {v.list.map((e) => {
                  const id = transitKey(e.t, e.type, e.n)
                  const open = sel === id
                  const k = KIND[e.kind], t = PL[e.t]!, n = PL[e.n]!, s = AS[e.type]!
                  const ret = e.type === '0' && e.t === e.n
                  const title = ret ? `${t[1]}กลับที่เดิม (${t[3]} Return)` : `${t[1]} ${s[2]} ${n[1]}เดิม`
                  const r = v.span(e)
                  const mo = Math.max(1, Math.round((r[1] - r[0]) / 30.4))
                  const p = e.passes
                  const [mean, how] = meaning(lib, e)
                  return (
                    <button class="ev" onClick={() => setSel(open ? '' : id)} aria-expanded={open} style={open ? { borderColor: 'rgba(185,166,255,.55)', background: 'rgba(185,166,255,.08)' } : e.big ? { borderColor: 'rgba(243,212,110,.35)' } : undefined}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                        <span style={{ width: '38px', height: '38px', flex: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', color: t[2], background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.10)' }}>{t[0] + V}</span>
                        <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, lineHeight: 1.35 }}><span style={{ fontSize: '14.5px', fontWeight: 600 }}>{title}</span><span class="lbl">{p.length > 1 ? `${fd(p[0])} – ${fd(p[p.length - 1])}` : fd(p[0])}</span></span>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span class="chip" style={{ color: k[1], background: k[2] }}>{k[0]}</span>
                          {e.big && <span style={{ fontSize: '11px', color: '#F3D46E', whiteSpace: 'nowrap' }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style={{ flex: 'none', verticalAlign: '-2px', marginRight: '3px' }}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>ครั้งใหญ่</span>}
                        </span>
                      </span>
                      {open && (
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
                          <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{mean}</span>
                          <span style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)' }}>
                            <span style={{ fontSize: '12px', color: '#9AA1B5' }}>มีผลราว {mo} เดือน · วันที่มุมพอดี{p.length > 1 ? ` · ผ่าน ${p.length} รอบ (ดาวถอยหลัง)` : ''}</span>
                            <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{p.map((x) => <span class="chip" style={{ color: '#F2F4FA', background: 'rgba(255,255,255,.08)' }}>{fd(x)}</span>)}</span>
                            {how && <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}><b style={{ color: '#F2F4FA' }}>ควรทำ:</b> {how}</span>}
                          </span>
                        </span>
                      )}
                      <span class="chv" data-o={String(open)} style={{ alignSelf: 'center', margin: '2px auto 0', width: 'max-content', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9AA1B5', lineHeight: 1 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
                    </button>
                  )
                })}
                {!v.list.length && <div class="card" style={{ padding: '20px', textAlign: 'center', fontSize: '14px', color: '#C9CEDC' }}>ปีนี้ไม่มีช่วงในหมวดที่เลือก</div>}
              </div>
            </>
          )}
          <span class="lbl">คำนวณจากตำแหน่งดาวจริง · มุมหลัก กุม ฉาก ตรีโกณ เล็ง · ดาวที่ถอยหลังอาจผ่านจุดเดิม 2–3 รอบ แถบสีคือช่วงที่มีผลในปีนั้น</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
