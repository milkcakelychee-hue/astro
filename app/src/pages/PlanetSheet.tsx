// แผ่นคำอธิบายดาว (Bottom sheet) — ตาม design/Sheet.dc.html · เปิดจากการแตะดาวในวงชาร์ต (#/main?p=a)
import { useState } from 'preact/hooks'
import type { Aspect, AspectType } from '../engine/aspects.ts'
import type { Chart, Pt } from '../engine/chart.ts'
import { signOf } from '../engine/dominants.ts'
import { aspectKey, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { ASPECT_COLOR, ASPECT_GLYPH, PT_EN, SIGN_EN, SIGN_GLYPH, SIGN_TH, degMin } from '../ui/astro-labels.ts'
import './sheet.css'

const NAME: Partial<Record<Pt, string>> = {
  S: 'อาทิตย์', M: 'จันทร์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต',
  n: 'ราหู', L: 'ลิลิธ', c: 'ไครอน', A: 'ลัคนา', C: 'กลางฟ้า', D: 'จุดตรงข้ามลัคนา', I: 'ก้นฟ้า', F: 'จุดโชคลาภ', X: 'Vertex',
}
const EN: Partial<Record<Pt, string>> = { ...PT_EN, n: 'North Node', L: 'Lilith', c: 'Chiron' }
const GL: Partial<Record<Pt, string>> = { S: '☉', M: '☽', m: '☿', V: '♀', a: '♂', J: '♃', s: '♄', U: '♅', N: '♆', P: '♇', n: '☊', L: '⚸', c: '⚷' }
const TS: Record<AspectType, string> = { '0': 'กุมกัน', '6': 'เปิดโอกาส', '4': 'ท้าทาย', '3': 'ส่งเสริม', '8': 'ตรงข้าม' }
const TN: Record<AspectType, string> = { '0': 'มุมกุมกัน (Conjunction) 0°', '6': 'มุมเปิดโอกาส (Sextile) 60°', '4': 'มุมท้าทาย (Square) 90°', '3': 'มุมส่งเสริม (Trine) 120°', '8': 'มุมตรงข้าม (Opposition) 180°' }
const PLANET = new Set<Pt>(['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P'])
const ord = (n: number) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th')
const V = '︎'

/** แยกส่วนของข้อความคลัง (รูปแบบจาก lib/gen.py) */
function parseSign(t: string | null) {
  if (!t) return null
  const body = splitTitle(t).body
  const [head = '', ...rest] = body.split(' จุดเด่น: ')
  const tail = rest.join(' จุดเด่น: ').split(' · ')
  const strong = tail[0] ?? ''
  const weak = (tail.find((x) => x.startsWith('ระวัง: ')) ?? '').replace('ระวัง: ', '')
  const extra = tail.filter((x, i) => i > 0 && !x.startsWith('ระวัง: '))
  const style = head.includes('แสดงออกแบบ') ? head.split('แสดงออกแบบ')[1]! : ''
  const dignity = extra.find((x) => /\((Domicile|Exaltation|Detriment|Fall)\)/.test(x)) ?? null
  return { head, style, strong, weak, extra: extra.filter((x) => x !== dignity), dignity }
}
function parseHouse(t: string | null) {
  if (!t) return null
  const body = splitTitle(t).body
  const m = /^พลังเรื่อง(.*) ไปลงที่เรื่อง(.*) — (.*)$/.exec(body)
  return m ? { topic: m[1]!, area: m[2]!, desc: m[3]!, body } : { topic: '', area: '', desc: body, body }
}

export function PlanetSheet(props: { pt: Pt; chart: Chart; aspects: Aspect[]; lib: InterpLib; known: boolean; personId: string; onClose: () => void }) {
  const { pt, chart, lib, known } = props
  const pos = chart.pos[pt]
  const s = signOf(pos.lon)
  const h = known ? chart.house(pos.lon) : null
  const { deg, min } = degMin(pos.lon)
  const ps = parseSign(text(lib, 'planet_sign', pt + s))
  const ph = h ? parseHouse(text(lib, 'planet_house', pt + h)) : null
  const name = NAME[pt]!
  const isPlanet = PLANET.has(pt)
  const title = `${isPlanet ? 'ดาว' : ''}${name}ในราศี${SIGN_TH[s]}${h ? ` เรือน ${h}` : ''}`
  const en = `${EN[pt]} in ${SIGN_EN[s]}${h ? `, ${ord(h)} House` : ''}`

  const mine = props.aspects
    // DC/IC ซ้ำกับลัคนา/กลางฟ้า (ตามตัวอย่างในดีไซน์ไม่แสดง)
    .filter((a) => (a.a === pt || a.b === pt) && !['D', 'I'].includes(a.a) && !['D', 'I'].includes(a.b))
    .sort((x, y) => x.orb - y.orb)
  const [sel, setSel] = useState(0)
  const [open1, setOpen1] = useState(false)

  // เหตุผลที่ดาวมีพลังเข้มข้น (ตามรายการในดีไซน์) — มุมรูปแบบใหญ่ (Grand Cross ฯลฯ) รอเครื่องคำนวณ patterns
  const tight = mine.filter((a) => a.orb <= 3).length
  const why: preact.ComponentChildren[] = []
  if (ps?.dignity) {
    const m = /^(.*?) \((\w+)\) ?(.*)$/.exec(ps.dignity)
    why.push(m ? <li><b style={{ color: '#F2F4FA' }}>{m[1]}</b> <span style={{ color: '#9AA1B5' }}>({m[2]})</span> {m[3]}</li> : <li>{ps.dignity}</li>)
  }
  if (h && h === s + 1) why.push(<li><b style={{ color: '#F2F4FA' }}>อยู่ในเรือนที่เข้ากับราศี</b> เรือน {h} คือเรือนที่ตรงกับธรรมชาติของราศี{SIGN_TH[s]} <span style={{ color: '#9AA1B5' }}>(Natural house)</span> เรื่องที่ดาวทำกับสถานที่ที่มันอยู่จึงไปทางเดียวกัน</li>)
  if (tight >= 3) why.push(<li><b style={{ color: '#F2F4FA' }}>ทำมุมแน่นหลายมุม</b> มีมุมที่ห่างจากมุมพอดีไม่เกิน 3° ถึง {tight} มุม <span style={{ color: '#9AA1B5' }}>(Tight aspects)</span> ดาวนี้จึงถูกกระตุ้นตลอด</li>)

  const cur = mine[sel]
  const other = (a: Aspect) => (a.a === pt ? a.b : a.a)
  const curText = cur ? text(lib, 'aspect', aspectKey(cur.a, cur.b, cur.type)) : null
  const cell = (bg: string, kc: string, k: string, v: string, ve: string, d: string, first: boolean) => (
    <div style={{ padding: '10px', background: bg, display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: first ? undefined : '1px solid rgba(255,255,255,.12)' }}>
      <span style={{ fontSize: '11px', color: kc }}>{k}</span>
      <span style={{ fontSize: '14px', fontWeight: 600 }}>{v} <span style={{ fontSize: '11px', color: '#9AA1B5', fontWeight: 400 }}>{ve}</span></span>
      {d && <span style={{ fontSize: '12px', color: '#C9CEDC' }}>{d}</span>}
    </div>
  )

  return (
    <div class="pg-sheet" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div aria-hidden="true" onClick={props.onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,4,8,.55)' }} />
      <section role="dialog" aria-label={`คำอธิบาย ${title}`} style={{ position: 'absolute', left: 0, right: 0, margin: '0 auto', maxWidth: '390px', top: '96px', bottom: 0, overflowY: 'auto', borderRadius: '28px 28px 0 0', background: 'linear-gradient(180deg,#151827 0%,#0C0E18 240px)', borderTop: '1px solid rgba(180,170,255,.30)', boxShadow: '0 -20px 60px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', color: '#F2F4FA', fontFamily: 'var(--font)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><span style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,.28)' }} /></div>
        <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ width: '48px', height: '48px', flex: 'none', borderRadius: '999px', background: 'radial-gradient(circle at 35% 30%,rgba(255,122,89,.45),rgba(255,122,89,.10))', border: '1px solid rgba(255,122,89,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#FF9C80' }}>{GL[pt]}{V}</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '12px', color: '#9AA1B5' }}>{isPlanet ? 'ดาว (Planet)' : 'จุด (Point)'} · {deg}°{String(min).padStart(2, '0')}′ {SIGN_GLYPH[s]}</span>
              <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 600, lineHeight: 1.35 }}>{title}</h1>
              <span style={{ fontSize: '13px', color: '#9AA1B5' }}>{en}</span>
            </div>
            <button aria-label="ปิด" onClick={props.onClose} style={{ width: '44px', height: '44px', flex: 'none', borderRadius: '999px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#F2F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${h ? 3 : 2},minmax(0,1fr))`, borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)' }}>
            {cell('rgba(255,122,89,.12)', '#FFB39F', `อะไร · ${isPlanet ? 'ดาว (Planet)' : 'จุด (Point)'}`, name, EN[pt] ?? '', ph?.topic ?? '', true)}
            {cell('rgba(111,178,255,.10)', '#B5D6FF', 'อย่างไร · ราศี (Sign)', SIGN_TH[s]!, SIGN_EN[s]!, ps?.style ?? '', false)}
            {h && cell('rgba(143,212,122,.10)', '#B9E6AC', 'ที่ไหน · เรือน (House)', `เรือน ${h}`, ord(h), ph?.area ?? '', false)}
          </div>

          {/* สรุปใน 1 บรรทัด / คำแนะนำ: คลังยังไม่มีหมวดนี้ — รอข้อความหมวดใหม่จาก lib/gen2.py */}

          {why.length > 0 && (
            <div class="blk" style={{ background: 'rgba(255,122,89,.07)', borderColor: 'rgba(255,122,89,.28)' }}>
              <div class="bh"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF9C80" stroke-width="1.8" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>ทำไมดาวนี้มีพลังเข้มข้น</div>
              <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', lineHeight: 1.65, color: '#DCE0EA' }}>{why}</ol>
              {ps?.dignity && why.length > 1 && <span style={{ fontSize: '12px', color: '#9AA1B5', lineHeight: 1.5 }}>ข้อ 1 เป็นความแข็งแรงตามหลักดั้งเดิม <span>(Essential dignity)</span> ข้อ 2–{why.length} เป็นตัวช่วยเสริม</span>}
            </div>
          )}

          {ps && (
            <div class="blk">
              <div class="bh"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9A6FF" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>ความหมาย</div>
              <p class="bp">{ps.head}</p>
              {open1 && (ph || ps.extra.length > 0) && <p class="bp" style={{ color: '#C9CEDC' }}>{[ph?.body, ...ps.extra].filter(Boolean).join(' · ')}</p>}
              {(ph || ps.extra.length > 0) && (
                <button class="more" onClick={() => setOpen1(!open1)}>{open1 ? 'ย่อ' : 'อ่านแบบละเอียด'} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style={open1 ? { transform: 'rotate(180deg)' } : undefined}><path d="m6 9 6 6 6-6" /></svg></button>
              )}
            </div>
          )}
          {ps?.strong && (
            <div class="blk">
              <div class="bh"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4FD1A5" stroke-width="1.8" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>จุดแข็ง</div>
              <p class="bp">{ps.strong}</p>
            </div>
          )}
          {ps?.weak && (
            <div class="blk">
              <div class="bh"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8A4C" stroke-width="1.8" aria-hidden="true"><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>จุดที่ต้องระวัง</div>
              <p class="bp">{ps.weak}</p>
            </div>
          )}

          {mine.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#C9CEDC' }}>มุมที่ดาวนี้ทำกับดาวอื่น <span style={{ fontWeight: 400, color: '#9AA1B5' }}>(Aspects) · แตะเพื่ออ่าน</span></span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mine.map((a, i) => (
                  <button class="chip" aria-expanded={i === sel} onClick={() => setSel(i === sel ? -1 : i)} style={i === sel ? { borderColor: '#7FB8FF', background: 'rgba(127,184,255,.14)' } : undefined}>
                    <b style={{ color: ASPECT_COLOR[a.type] }}>{ASPECT_GLYPH[a.type]}</b> {NAME[other(a)]} {Math.round(a.orb)}°
                  </button>
                ))}
              </div>
              {cur && (
                <div style={{ padding: '12px 14px', borderRadius: '14px', background: '#1D2135', border: '1px solid rgba(127,184,255,.30)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{name} {TS[cur.type]} {NAME[other(cur)]}</span>
                  <span style={{ fontSize: '12px', color: '#9AA1B5' }}>{TN[cur.type]} · ห่างจากมุมพอดี {Math.round(cur.orb)}°</span>
                  {curText && <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{splitTitle(curText).body}</span>}
                </div>
              )}
            </div>
          )}

        </div>
      </section>
    </div>
  )
}
