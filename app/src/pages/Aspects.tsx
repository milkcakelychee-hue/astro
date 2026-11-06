// หน้า "มุมดาวทั้งหมด" — ตาม design/Aspects.dc.html
import { AspectParts } from '../ui/AspectParts.tsx'
import { useEffect, useState } from 'preact/hooks'
import { allowedOrb, aspectsOf, type Aspect, type AspectType } from '../engine/aspects.ts'
import { PLANETS, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { birthInput, getMe, timeKnown, type Person } from '../data/people.ts'
import { aspectKey, loadLib, text, type InterpLib } from '../lib/interp.ts'
import { ASPECT_COLOR, ASPECT_GLYPH, PT_EN, glyph, hhmm, thaiDate, V } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import './aspects.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.42),transparent 70%),radial-gradient(460px 380px at -10% 300px,rgba(31,165,135,.28),transparent 70%),#06070D'

// ชื่อและสัญลักษณ์ตามที่หน้านี้ในดีไซน์ใช้
const NAME: Record<Pt, string> = {
  S: 'อาทิตย์', M: 'จันทร์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต',
  n: 'ราหู', L: 'ลิลิธ', c: 'ไครอน', A: 'ลัคนา', C: 'กลางฟ้า', D: 'จุดตรงข้ามลัคนา', I: 'ก้นฟ้า', F: 'จุดโชคลาภ', X: 'Vertex',
}
const EN: Partial<Record<Pt, string>> = { ...PT_EN, n: 'North Node', L: 'Lilith', c: 'Chiron', A: 'Ascendant', C: 'Midheaven', D: 'Descendant', I: 'IC', F: 'Fortune', X: 'Vertex' }
const GL: Partial<Record<Pt, string>> = { D: 'DC', I: 'IC', F: '⊗' + V, X: 'Vx' }
const g = (p: Pt) => GL[p] ?? glyph(p)

const TB: Record<AspectType, string> = { '0': 'rgba(243,212,110,.14)', '6': 'rgba(127,184,255,.14)', '4': 'rgba(255,138,76,.14)', '3': 'rgba(79,209,165,.14)', '8': 'rgba(255,107,107,.14)' }
const TD: Record<AspectType, string> = { '0': 'rgba(243,212,110,.35)', '6': 'rgba(127,184,255,.35)', '4': 'rgba(255,138,76,.35)', '3': 'rgba(79,209,165,.35)', '8': 'rgba(255,107,107,.35)' }
const TS: Record<AspectType, string> = { '0': 'กุมกัน', '6': 'เปิดโอกาส', '4': 'ท้าทาย', '3': 'ส่งเสริม', '8': 'ตรงข้าม' }
const TW: Record<AspectType, string> = { '0': 'กุม', '6': 'โยค', '4': 'ฉาก', '3': 'ตรีโกณ', '8': 'เล็ง' }
const TIERS: [number, string, string, string, string][] = [
  [0.85, 'มีอิทธิพลมาก', '#F3D46E', 'rgba(243,212,110,.08)', 'orb แคบมาก รู้สึกได้ชัดที่สุด'],
  [0.6, 'มีอิทธิพล', '#B9A6FF', 'rgba(185,166,255,.08)', 'มีผลชัดในชีวิตประจำวัน'],
  [0.3, 'ปานกลาง', '#7FB8FF', 'rgba(127,184,255,.07)', 'มีผลเป็นพื้นหลัง'],
  [-1, 'เบา', '#9AA1B5', 'rgba(255,255,255,.04)', 'อ่อน แต่ยังนับเป็นมุม'],
]
const tierOf = (p: number) => TIERS.findIndex((t) => p >= t[0])
const fo = (m: number) => `${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′`

interface Row { a: Aspect; max: number; p: number; tier: number; mean: string | null }

export function Aspects() {
  const [d, setD] = useState<{ person: Person; asp: Aspect[]; lib: InterpLib } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tab, setTab] = useState(0)
  const [sel, setSel] = useState(-1)
  const [op, setOp] = useState<Record<number, boolean>>({})

  useEffect(() => {
    getMe()
      .then(async (person) => {
        if (!person) {
          location.hash = '#/main'
          return
        }
        const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
        setD({ person, asp: aspectsOf(swe, birthInput(person)), lib })
      })
      .catch((e: unknown) => setErr(String(e)))
  }, [])

  const header = (
    <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <a href="#/main" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ชาร์ตของฉัน
      </a>
      <span style={{ width: '72px' }} />
    </div>
  )
  if (err) return <Page background={BG}>{header}<div style={{ padding: '8px 20px', color: '#FF9A9A' }}>{err}</div></Page>
  if (!d) return <Page background={BG}>{header}</Page>

  const { person, asp, lib } = d
  const isPl = (x: Aspect) => PLANETS.includes(x.a) && PLANETS.includes(x.b)
  const nP = asp.filter(isPl).length
  const rows: Row[] = asp
    .filter((x) => (tab === 0 ? isPl(x) : !isPl(x)))
    .map((a) => {
      const max = allowedOrb(a.a, a.b, a.type)
      const p = 1 - a.orbMin / 60 / max
      const t = text(lib, 'aspect', aspectKey(a.a, a.b, a.type))
      return { a, max, p, tier: tierOf(p), mean: t }
    })
    .sort((x, y) => y.p - x.p)

  const sub = `${person.name} · ${thaiDate(person.y, person.mo, person.d)}` + (timeKnown(person) ? ` · ${hhmm(person.hh!, person.mi!)} น.` : '')
  const switchTab = (t: number) => {
    setTab(t)
    setSel(-1)
    setOp({})
  }

  return (
    <Page background={BG}>
      <div class="pg-asp">
        {header}
        <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{sub}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600 }}>มุมดาวทั้งหมด <span style={{ fontSize: '15px', color: '#9AA1B5', fontWeight: 400 }}>(Aspects)</span></h1>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: 0, top: '26.5px' /* กึ่งกลางกับ h1 */, width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div data-intro style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {[['คืออะไร', 'มุมทั้งหมดที่ดาวในชาร์ตกำเนิดทำต่อกัน เรียงจากมีอิทธิพลมากไปน้อย'], ['ใช้ดู', 'ดูว่าพลังด้านต่างๆ ในตัวเราเสริมกันหรือขัดกันตรงไหน'], ['ทำไมสำคัญ', 'มุมที่ใกล้ตรงพอดีมาก คือแก่นนิสัยและบทเรียนที่เด่นที่สุดในชีวิต']].map(([k, v]) => (
                  <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>
                ))}
              </div>
            </details>
          </div>

          <div role="tablist" aria-label="กลุ่มมุม" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
            <button role="tab" aria-selected={tab === 0} class={tab === 0 ? 'seg on' : 'seg'} onClick={() => switchTab(0)}>ระหว่างดาว · {nP}</button>
            <button role="tab" aria-selected={tab === 1} class={tab === 1 ? 'seg on' : 'seg'} onClick={() => switchTab(1)}>กับจุดอื่น · {asp.length - nP}</button>
          </div>
          <span class="lbl">{tab === 0 ? 'มุมระหว่างดาว 10 ดวง (Planet aspects)' : 'มุมที่เกี่ยวกับราหู ลิลิธ ไครอน จุดโชคลาภ Vertex และแกนชาร์ต ASC DSC MC IC (Other aspects)'}</span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '6px 10px', padding: '12px 14px', borderRadius: '16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <span class="lg"><b style={{ color: '#F3D46E' }}>☌{V}</b> กุมกัน (Conjunction) 0°</span>
            <span class="lg"><b style={{ color: '#7FB8FF' }}>⚹{V}</b> เปิดโอกาส (Sextile) 60°</span>
            <span class="lg"><b style={{ color: '#FF8A4C' }}>□{V}</b> ท้าทาย (Square) 90°</span>
            <span class="lg"><b style={{ color: '#4FD1A5' }}>△{V}</b> ส่งเสริม (Trine) 120°</span>
            <span class="lg"><b style={{ color: '#FF6B6B' }}>☍{V}</b> ตรงข้าม (Opposition) 180°</span>
            <span class="lg">ตัวเลข = ห่างจากมุมพอดี (Orb)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>เรียงจากมุมที่มีอิทธิพลมากที่สุด</span><span class="lbl">ยิ่งดาวสองดวงทำมุมใกล้พอดี ยิ่งมีอิทธิพลต่อชีวิตมาก</span></div>
            <span class="lbl">แตะเพื่ออ่าน</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
            {rows.slice(0, 3).map((r, i) => (
              <button onClick={() => { setSel(i); setOp({ ...op, [r.tier]: true }) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 6px', borderRadius: '16px', border: '1px solid ' + (i === 0 ? 'rgba(170,160,255,.45)' : 'rgba(255,255,255,.10)'), background: i === 0 ? 'linear-gradient(160deg,rgba(138,92,255,.35),rgba(31,165,135,.18))' : 'rgba(255,255,255,.05)', color: '#F2F4FA', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '11px', color: '#D6CEFF', fontWeight: 600 }}>อันดับ {i + 1}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px' }}><span>{g(r.a.a)}</span><span style={{ color: ASPECT_COLOR[r.a.type], fontWeight: 700 }}>{ASPECT_GLYPH[r.a.type]}</span><span>{g(r.a.b)}</span></span>
                <span style={{ fontSize: '12px', textAlign: 'center', lineHeight: 1.35 }}>{NAME[r.a.a]}<br />{TW[r.a.type]} {NAME[r.a.b]}</span>
                <span style={{ fontSize: '11px', color: '#C9CEDC', fontVariantNumeric: 'tabular-nums' }}>orb {fo(r.a.orbMin)}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TIERS.map((T, k) => {
              const list = rows.map((r, i) => ({ r, i })).filter((x) => x.r.tier === k)
              if (!list.length) return null
              const on = !!op[k]
              return (
                <div style={{ borderRadius: '18px', background: 'rgba(255,255,255,.05)', border: '1px solid ' + (on ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.10)'), overflow: 'hidden' }}>
                  <button onClick={() => setOp({ ...op, [k]: !on })} aria-expanded={on} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', minHeight: '56px', padding: '0 16px', border: 'none', background: on ? T[3] : 'transparent', color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}>
                    <span style={{ width: '10px', height: '10px', flex: 'none', borderRadius: '9px', background: T[2], boxShadow: '0 0 10px ' + T[2] }} />
                    <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}><span style={{ fontSize: '15px', fontWeight: 600, color: T[2] }}>{T[1]}</span><span class="lbl">{T[4]}</span></span>
                    <span style={{ fontSize: '12px', color: '#C9CEDC', whiteSpace: 'nowrap' }}>{list.length} มุม</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9CEDC" stroke-width="2" aria-hidden="true" style={on ? { transform: 'rotate(180deg)' } : undefined}><path d="m6 9 6 6 6-6" /></svg>
                  </button>
                  {on && list.map(({ r, i }) => <AspRow r={r} i={i} open={i === sel} onPick={() => setSel(i === sel ? -1 : i)} />)}
                </div>
              )
            })}
          </div>
          
        </div>
      </div>
    </Page>
  )
}

function AspRow({ r, i, open, onPick }: { r: Row; i: number; open: boolean; onPick: () => void }) {
  const { a } = r
  const c = ASPECT_COLOR[a.type]
  const top3 = i < 3
  const mx = (a.applying ? 50 - (1 - r.p) * 46 : 50 + (1 - r.p) * 46).toFixed(1) + '%'
  const pct = Math.round(r.p * 100) + '%'
  const lum = a.a === 'S' || a.a === 'M' || a.b === 'S' || a.b === 'M'
  const side = (p: Pt) => (
    <span class="pc"><span class="gl">{g(p)}</span><span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}><span style={{ fontSize: '13.5px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{NAME[p]}</span><span class="lbl" style={{ fontSize: '11px' }}>{EN[p]}</span></span></span>
  )
  return (
    <button class="ar" onClick={onPick} aria-expanded={open} style={open ? { background: 'rgba(255,255,255,.05)' } : undefined}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
        <span class="rk" style={{ background: top3 ? 'linear-gradient(135deg,#8A5CFF,#1FA587)' : 'rgba(255,255,255,.07)', color: top3 ? '#FFFFFF' : '#C9CEDC' }}>{i + 1}</span>
        <span style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 34px minmax(0,1fr)', alignItems: 'center', gap: '6px' }}>
          {side(a.a)}
          <span class="ai" style={{ color: c, background: TB[a.type], border: '1px solid ' + TD[a.type] }}>{ASPECT_GLYPH[a.type]}</span>
          {side(a.b)}
        </span>
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', minWidth: 0, paddingLeft: '40px', boxSizing: 'border-box' }}>
        <span class="chip" style={{ color: c, background: TB[a.type] }}>{TS[a.type]}</span>
        <span class="chip" style={{ color: '#C9CEDC', background: 'rgba(255,255,255,.07)' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d={a.applying ? 'M5 12h14M13 6l6 6-6 6' : 'M19 12H5M11 6l-6 6 6 6'} /></svg>{a.applying ? 'เข้าใกล้' : 'ห่างออก'}</span>
        <span style={{ marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ position: 'relative', width: '40px', height: '10px' }}>
            <span style={{ position: 'absolute', left: 0, right: 0, top: '4px', height: '2px', borderRadius: '9px', background: 'rgba(255,255,255,.15)' }} />
            <span style={{ position: 'absolute', left: '50%', top: 0, width: '2px', height: '10px', marginLeft: '-1px', background: 'rgba(255,255,255,.6)' }} />
            <span style={{ position: 'absolute', top: '1px', left: mx, width: '8px', height: '8px', marginLeft: '-4px', borderRadius: '9px', background: c }} />
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#F2F4FA' }}>{fo(a.orbMin)}</span>
        </span>
      </span>
      {open && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0 0 40px', boxSizing: 'border-box', width: 'calc(100% - 40px)', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)' }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ position: 'relative', height: '16px' }}>
              <span style={{ position: 'absolute', left: 0, right: 0, top: '7px', height: '2px', borderRadius: '9px', background: 'linear-gradient(90deg,rgba(127,227,192,.15),rgba(127,227,192,.6) 48%,rgba(255,255,255,.9) 50%,rgba(154,161,181,.5) 52%,rgba(154,161,181,.12))' }} />
              <span style={{ position: 'absolute', left: '50%', top: '1px', width: '2px', height: '14px', marginLeft: '-1px', background: '#F2F4FA', borderRadius: '2px' }} />
              <span style={{ position: 'absolute', top: '3px', left: mx, width: '10px', height: '10px', marginLeft: '-5px', borderRadius: '9px', background: c, boxShadow: '0 0 8px ' + c }} />
            </span>
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#9AA1B5' }}><span>← เข้าใกล้</span><span style={{ color: '#F2F4FA' }}>ตรงพอดี</span><span>ห่างออก →</span></span>
            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9AA1B5' }}><span>ระดับอิทธิพล <b style={{ color: '#F2F4FA' }}>{pct}</b></span><span>ห่าง {fo(a.orbMin)} จากที่นับได้ {r.max}°</span></span>
          </span>
          <span style={{ fontSize: '11.5px', lineHeight: 1.5, color: '#9AA1B5' }}>มุมนี้จะนับว่าเกิดขึ้นเมื่อดาวสองดวงห่างจากองศาพอดีไม่เกิน {r.max}° ({lum ? 'มีอาทิตย์หรือจันทร์ จึงได้ระยะกว้างกว่า' : 'ดาวทั่วไป'}) มุมนี้ห่าง {fo(a.orbMin)} จึงมีอิทธิพล {pct}</span>
          {r.mean && <AspectParts text={r.mean} />}
        </span>
      )}
    </button>
  )
}
