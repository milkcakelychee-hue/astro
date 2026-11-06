// แผ่นหมวดละเอียดของหน้าชาร์ต (ผู้ใช้ขอ): ดาว · เรือน · มุมดาว · สถิติ — เปิดจากปุ่มหมวด (#/main?cat=…)
// ใช้กรอบเดียวกับ PlanetSheet (design/Sheet.dc.html) · ข้อความทั้งหมดมาจากคลัง
import type { Aspect } from '../engine/aspects.ts'
import { PLANETS, type Chart, type Pt } from '../engine/chart.ts'
import { elementOfSign, signOf, type Dominants } from '../engine/dominants.ts'
import { aspectKey, houseKey, signKey, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { ASPECT_COLOR, ASPECT_GLYPH, ASPECT_MOOD, ELEMENT_COLOR, ELEMENT_TH, HOUSE_TOPIC, MODALITY_TH, PT_TH, SIGN_GLYPH, SIGN_TH, fmtDeg, glyph } from '../ui/astro-labels.ts'
import './sheet.css'

export type Cat = 'planets' | 'houses' | 'aspects' | 'stats'
export const CAT_TITLE: Record<Cat, string> = { planets: 'ดาว', houses: 'เรือน', aspects: 'มุมดาว', stats: 'สถิติ' }

const row = { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#F2F4FA' }
const gl = { width: '36px', height: '36px', flex: 'none', borderRadius: '12px', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }

export function CategorySheet(props: { cat: Cat; chart: Chart; aspects: Aspect[]; dom: Dominants; lib: InterpLib; known: boolean; ptHref: (p: Pt) => string; onClose: () => void }) {
  const { cat, chart, aspects, dom, lib, known } = props
  const pts: Pt[] = [...PLANETS, 'n', 'L', 'c', ...(known ? (['A', 'C'] as Pt[]) : [])]
  const hOf = (p: Pt) => (p === 'A' ? 1 : p === 'C' ? 10 : chart.house(chart.pos[p].lon))

  let body: preact.ComponentChildren
  if (cat === 'planets') {
    body = pts.map((p) => {
      const s = signOf(chart.pos[p].lon)
      const t = text(lib, 'planet_sign', signKey(p, s))
      return (
        <a href={props.ptHref(p)} class="blk">
          <span style={row}><span style={gl}>{glyph(p)}</span><span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span class="bh">{PT_TH[p]}ราศี{SIGN_TH[s]}</span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{fmtDeg(chart.pos[p].lon)}{known ? ` · เรือน ${hOf(p)}` : ''}{chart.pos[p].speed < 0 ? ' · ถอยหลัง' : ''}</span></span><span style={{ color: '#7FB8FF' }}>›</span></span>
          {t && <p class="bp">{splitTitle(t).body}</p>}
        </a>
      )
    })
  } else if (cat === 'houses') {
    body = !known
      ? <p class="bp">ไม่ทราบเวลาเกิด จึงคำนวณเรือนไม่ได้</p>
      : Array.from({ length: 12 }, (_, i) => {
        const h = i + 1
        const s = signOf(chart.cusps[i]!)
        const inH = pts.filter((p) => p !== 'A' && p !== 'C' && hOf(p) === h)
        return (
          <div class="blk">
            <span style={row}><span style={{ ...gl, fontSize: '15px', fontWeight: 700 }}>{h}</span><span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}><span class="bh">เรือน {h} · {HOUSE_TOPIC[h]}</span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>เริ่มที่ราศี{SIGN_TH[s]} <span style={{ color: ELEMENT_COLOR[elementOfSign(s)] }}>{SIGN_GLYPH[s]}</span>{inH.length ? '' : ' · ไม่มีดาว'}</span></span></span>
            {inH.map((p) => {
              const t = text(lib, 'planet_house', houseKey(p, h))
              return <a href={props.ptHref(p)} style={{ textDecoration: 'none' }}><p class="bp"><b>{glyph(p)} {PT_TH[p]}</b> {t ? splitTitle(t).body : ''}</p></a>
            })}
          </div>
        )
      })
  } else if (cat === 'aspects') {
    const groups: [string, string, (a: Aspect) => boolean][] = [
      ['❤️ ส่งเสริม', 'มุม 60° และ 120° พลังไหลลื่น', (a) => a.type === '6' || a.type === '3'],
      ['⚡ ท้าทาย', 'มุม 90° และ 180° แรงกดดันที่พาให้โต', (a) => a.type === '4' || a.type === '8'],
      ['🔥 กุมกัน', 'ดาวอยู่ตำแหน่งเดียวกัน พลังรวมเป็นหนึ่ง', (a) => a.type === '0'],
    ]
    body = groups.map(([t, sub, f]) => {
      const xs = aspects.filter(f).sort((x, y) => x.orb - y.orb)
      if (!xs.length) return null
      return (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}><span style={{ fontSize: '16px', fontWeight: 600 }}>{t} · {xs.length} มุม</span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{sub}</span></div>
          {xs.map((a) => {
            const tx = text(lib, 'aspect', aspectKey(a.a, a.b, a.type))
            return (
              <div class="blk">
                <span class="bh"><span>{glyph(a.a)}</span><b style={{ color: ASPECT_COLOR[a.type] }}>{ASPECT_GLYPH[a.type]}</b><span>{glyph(a.b)}</span><span style={{ flex: 1 }}>{PT_TH[a.a]} {ASPECT_MOOD[a.type]} {PT_TH[a.b]}</span><span style={{ fontSize: '12px', color: '#9AA1B5', fontWeight: 400 }}>{Math.floor(a.orbMin / 60)}°{String(a.orbMin % 60).padStart(2, '0')}′</span></span>
                {tx && <p class="bp">{splitTitle(tx).body}</p>}
              </div>
            )
          })}
        </>
      )
    })
  } else {
    // นับดาว 10 ดวงตามธาตุและลักษณะ
    const cnt = (f: (s: number) => number, n: number) => {
      const out = Array<Pt[]>(n).fill([]).map(() => [] as Pt[])
      for (const p of PLANETS) out[f(signOf(chart.pos[p].lon))]!.push(p)
      return out
    }
    const els = cnt(elementOfSign, 4), mods = cnt((s) => s % 3, 3)
    const hem = known ? [PLANETS.filter((p) => hOf(p) >= 7).length, PLANETS.filter((p) => hOf(p) <= 6).length] : null
    const rx = PLANETS.filter((p) => chart.pos[p].speed < 0)
    const ranked = [...dom.rows].sort((a, b) => b.total - a.total)
    const line = (label: string, ps: Pt[], color?: string) => (
      <div style={{ display: 'grid', gridTemplateColumns: '64px 24px minmax(0,1fr)', gap: '8px', alignItems: 'center', fontSize: '14px' }}><span style={{ color: color ?? '#C9CEDC', fontWeight: 600 }}>{label}</span><span style={{ fontWeight: 700 }}>{ps.length}</span><span style={{ color: '#DCE0EA' }}>{ps.map(glyph).join(' ')}</span></div>
    )
    body = (
      <>
        <div class="blk"><span class="bh">ดาว 10 ดวงตามธาตุ</span>{els.map((ps, i) => line(ELEMENT_TH[i]!, ps, ELEMENT_COLOR[i]))}</div>
        <div class="blk"><span class="bh">ตามลักษณะราศี</span>{mods.map((ps, i) => line(MODALITY_TH[i]!, ps))}</div>
        {hem && <div class="blk"><span class="bh">ซีกฟ้า</span><p class="bp">ซีกบน (เรือน 7–12 เรื่องโลกภายนอก) {hem[0]} ดวง · ซีกล่าง (เรือน 1–6 เรื่องส่วนตัว) {hem[1]} ดวง</p></div>}
        <div class="blk"><span class="bh">ดาวถอยหลัง {rx.length} ดวง</span><p class="bp">{rx.length ? rx.map((p) => `${glyph(p)} ${PT_TH[p]}`).join(' · ') : 'ไม่มี'}</p></div>
        <div class="blk"><span class="bh">มุมดาว {aspects.length} มุม</span>{(['0', '6', '3', '4', '8'] as const).map((t) => <div style={{ display: 'flex', gap: '8px', fontSize: '14px' }}><b style={{ color: ASPECT_COLOR[t], width: '20px' }}>{ASPECT_GLYPH[t]}</b><span style={{ flex: 1, color: '#DCE0EA' }}>{ASPECT_MOOD[t]}</span><span>{aspects.filter((a) => a.type === t).length}</span></div>)}</div>
        <div class="blk"><span class="bh">คะแนนดาวเด่นทั้งหมด</span>{ranked.map((d) => <a href={props.ptHref(d.planet)} style={{ display: 'flex', gap: '8px', fontSize: '14px', textDecoration: 'none', color: '#DCE0EA' }}><span style={{ width: '22px' }}>{glyph(d.planet)}</span><span style={{ flex: 1 }}>{PT_TH[d.planet]}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{d.total} · {((d.total / dom.sum) * 100).toFixed(1)}%</span></a>)}</div>
      </>
    )
  }

  return (
    <div class="pg-sheet" style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div aria-hidden="true" onClick={props.onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,4,8,.55)' }} />
      <section role="dialog" aria-label={`หมวด${CAT_TITLE[cat]}`} style={{ position: 'absolute', left: 0, right: 0, margin: '0 auto', maxWidth: '390px', top: '96px', bottom: 0, overflowY: 'auto', borderRadius: '28px 28px 0 0', background: 'linear-gradient(180deg,#151827 0%,#0C0E18 240px)', borderTop: '1px solid rgba(180,170,255,.30)', boxShadow: '0 -20px 60px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', color: '#F2F4FA', fontFamily: 'var(--font)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><span style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,.28)' }} /></div>
        <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ flex: 1, margin: 0, fontSize: '21px', fontWeight: 600 }}>{CAT_TITLE[cat]}ในชาร์ต</h1>
            <button aria-label="ปิด" onClick={props.onClose} style={{ width: '36px', height: '36px', borderRadius: '999px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#F2F4FA', fontSize: '18px' }}>✕</button>
          </div>
          {body}
        </div>
      </section>
    </div>
  )
}
