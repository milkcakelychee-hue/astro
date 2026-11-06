// แผ่น "รายละเอียดดาวจร" — ตาม new-screens/TodayTransitSheet.dc.html · เปิดจากแถวดาวจรในหน้าวันนี้
import { useEffect, useState } from 'preact/hooks'
import { ANGLE_DEG, type AspectType } from '../engine/aspects.ts'
import { computeChart, mod, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { bodyAt, dateOfJd, thaiParts, type Transit } from '../engine/sky.ts'
import { exactPasses } from '../engine/transits.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { houseKey, splitTitle, text, transitKey, type InterpLib } from '../lib/interp.ts'
import { ASPECT_COLOR, ASPECT_GLYPH, HOUSE_TOPIC, PT_TH, glyph } from '../ui/astro-labels.ts'

const AN: Record<AspectType, [string, string, string]> = {
  '0': ['กุม', 'มุมกุมกัน (Conjunction) 0°', 'รวมพลัง เข้มข้น'], '6': ['โยค', 'มุมเปิดโอกาส (Sextile) 60°', 'เปิดโอกาส ใช้ได้ถ้าลงมือ'],
  '4': ['ฉาก', 'มุมท้าทาย (Square) 90°', 'เสียดทาน ผลักให้แก้'], '3': ['ตรีโกณ', 'มุมส่งเสริม (Trine) 120°', 'ไหลลื่น ง่ายกว่าปกติ'],
  '8': ['เล็ง', 'มุมตรงข้าม (Opposition) 180°', 'ดึงกันสองฝั่ง ต้องหาสมดุล'],
}
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const fd = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.d} ${MS[p.mo - 1]} ${String(p.y + 543).slice(2)}` }
const card = { padding: '14px 16px', borderRadius: '22px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', flexDirection: 'column', gap: '10px' } as const
const chip = (bg: string, c: string, t: string) => <span style={{ height: '24px', padding: '0 9px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', background: bg, color: c }}>{t}</span>

/** ข้อความคลัง transit: "แก่นเรื่อง: X — Y · ควรทำ: Z · ระยะผล" */
function parseTransit(s: string | null) {
  if (!s) return null
  const parts = splitTitle(s).body.split(' · ')
  const [head = '', how = ''] = parts[0]!.split(' — ')
  const theme = head.replace(/^แก่นเรื่อง: /, '')
  const tip = (parts.find((x) => x.startsWith('ควรทำ: ')) ?? '').replace('ควรทำ: ', '')
  return { theme, mean: how ? `${theme} — ${how}` : theme, tip }
}
/** คำสำคัญของดาวจากคลัง planet_house ("พลังเรื่อง… ไปลงที่…") */
const kw = (lib: InterpLib, p: Pt) => /พลังเรื่อง(.*?) ไปลงที่/.exec(text(lib, 'planet_house', houseKey(p, 1)) ?? '')?.[1]?.split(' ').slice(0, 2).join(' ') ?? ''

export function TransitSheet(props: { tr: Transit; jd: number; lib: InterpLib; dur: string; onClose: () => void }) {
  const { tr, jd, lib } = props
  const [st, setSt] = useState<{ natal: Chart; known: boolean; passes: number[]; applying: boolean } | null>(null)
  useEffect(() => {
    ;(async () => {
      const [swe, me] = await Promise.all([getBrowserSwe(), getMe()])
      if (!me) return
      const natal = computeChart(swe, birthInput(me))
      const ln = natal.aspectPos[tr.n].lon
      const orbAt = (x: number) => { const d = Math.abs(mod(bodyAt(swe, x, tr.t).lon - ln, 360)); return Math.abs(Math.min(d, 360 - d) - ANGLE_DEG[tr.type]) }
      setSt({ natal, known: timeKnown(me), passes: exactPasses(swe, natal, tr, jd), applying: orbAt(jd + 0.01) < tr.orb })
    })()
  }, [])
  const tx = parseTransit(text(lib, 'transit', transitKey(tr.t, tr.type, tr.n)))
  const a = AN[tr.type], col = ASPECT_COLOR[tr.type]
  const om = Math.floor(tr.orb * 60)
  const nh = st?.known ? (tr.n === 'A' ? 1 : tr.n === 'C' ? 10 : st.natal.house(st.natal.pos[tr.n].lon)) : null
  const past = st ? st.passes.filter((x) => x < jd).length : 0
  // ตำแหน่งบนแถบ: เข้าใกล้ = ซ้ายของกลาง, ห่างออก = ขวา
  const pos = st ? (st.applying ? 50 - (tr.orb / 3) * 46 : 50 + (tr.orb / 3) * 46) : 50
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div aria-hidden="true" onClick={props.onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,4,8,.55)' }} />
      <section role="dialog" aria-label="รายละเอียดดาวจร" style={{ position: 'absolute', left: 0, right: 0, margin: '0 auto', maxWidth: '390px', top: '70px', bottom: 0, overflowY: 'auto', borderRadius: '28px 28px 0 0', background: 'linear-gradient(180deg,#151827 0%,#0C0E18 240px)', borderTop: '1px solid rgba(180,170,255,.30)', boxShadow: '0 -12px 40px rgba(0,0,0,.45)', color: '#F2F4FA', fontFamily: 'var(--font)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><span style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,.28)' }} /></div>
        <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '999px', background: col + '24', border: `1px solid ${col}66`, fontSize: '20px' }}><span>{glyph(tr.t)}</span><span style={{ color: col, fontSize: '16px' }}>{ASPECT_GLYPH[tr.type]}</span><span>{glyph(tr.n)}</span></span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '12px', color: '#9AA1B5' }}>ดาวจร (Transit) · {a[1]}</span><h1 style={{ margin: 0, fontSize: '21px', fontWeight: 600, lineHeight: 1.35 }}>{PT_TH[tr.t]}จร {a[0]} {PT_TH[tr.n]}ของคุณ</h1></div>
            <button aria-label="ปิด" onClick={props.onClose} style={{ width: '44px', height: '44px', flex: 'none', borderRadius: '999px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#F2F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {st && (st.applying ? chip('rgba(127,227,192,.14)', '#9FEAC0', '→ กำลังเข้าใกล้') : chip('rgba(255,255,255,.08)', '#C9CEDC', '← กำลังห่างออก'))}
            {chip('rgba(255,255,255,.08)', '#DCE0EA', `ห่าง ${Math.floor(om / 60)}°${String(om % 60).padStart(2, '0')}′`)}
            {chip('rgba(255,255,255,.08)', '#DCE0EA', props.dur)}
            {tr.retro && chip('rgba(255,255,255,.08)', '#DCE0EA', `${PT_TH[tr.t]}ถอยหลัง`)}
          </div>
          {tx?.theme && <div style={{ padding: '14px 16px', borderRadius: '16px', background: 'linear-gradient(135deg,rgba(138,92,255,.30),rgba(31,165,135,.22))', border: '1px solid rgba(170,160,255,.35)', display: 'flex', flexDirection: 'column', gap: '4px' }}><span style={{ fontSize: '12px', color: '#D6CEFF' }}>สรุปใน 1 บรรทัด</span><span style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.5 }}>{tx.theme}</span></div>}
          {st && st.passes.length > 0 && (
            <div style={card}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>จังหวะของมุมนี้</span>
              <div style={{ position: 'relative', height: '10px', borderRadius: '5px', background: `linear-gradient(90deg,rgba(127,227,192,.35),${col} 50%,rgba(154,161,181,.35))` }}><span style={{ position: 'absolute', left: `${pos}%`, top: '-5px', width: '20px', height: '20px', marginLeft: '-10px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,.6)' }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9AA1B5' }}><span>← เข้าใกล้</span><span>ตรงพอดี</span><span>ห่างออก →</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                {st.passes.map((x, i) => {
                  const done = x < jd, cur = i === past
                  const days = Math.ceil(x - jd)
                  return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '10px', background: cur ? 'rgba(185,166,255,.18)' : 'rgba(255,255,255,.04)' }}><span style={{ color: done ? '#9AA1B5' : undefined }}>ครั้งที่ {i + 1}</span>{cur ? <b>{fd(x)} · {days <= 0 ? 'วันนี้' : `อีก ${days} วัน`}</b> : <span style={{ color: done ? '#9AA1B5' : undefined }}>{fd(x)}{done ? ' · ผ่านแล้ว' : ''}</span>}</div>
                })}
              </div>
              {st.passes.length >= 3 && <span style={{ fontSize: '12px', color: '#9AA1B5', lineHeight: 1.6 }}>ดาวช้าที่ถอยหลังมักตรงพอดีซ้ำ 3 ครั้ง ผลชัดที่สุดรอบวันตรงพอดี</span>}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.12)' }}>
            <div style={{ padding: '10px', background: 'rgba(91,209,255,.10)', display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '11px', color: '#9FE3FF' }}>ดาวจร = อะไร</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{PT_TH[tr.t]}</span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{kw(lib, tr.t)}</span></div>
            <div style={{ padding: '10px', background: col + '1A', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid rgba(255,255,255,.12)' }}><span style={{ fontSize: '11px', color: col }}>มุม = อย่างไร</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{a[0]}</span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{a[2]}</span></div>
            <div style={{ padding: '10px', background: 'rgba(255,143,177,.10)', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid rgba(255,255,255,.12)' }}><span style={{ fontSize: '11px', color: '#FFC0D2' }}>ดาวเดิม = เรื่องไหน</span><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{PT_TH[tr.n]}{nh ? ` เรือน ${nh}` : ''}</span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{nh ? HOUSE_TOPIC[nh] : kw(lib, tr.n)}</span></div>
          </div>
          {tx?.mean && <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>ความหมาย</span><p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#DCE0EA' }}>{tx.mean}</p></div>}
          {tx?.tip && <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', borderRadius: '16px', background: 'rgba(79,209,165,.08)', border: '1px solid rgba(79,209,165,.30)' }}><span style={{ fontSize: '15px', fontWeight: 600, color: '#9FEAC0' }}>ควรทำช่วงนี้</span><p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#DCE0EA' }}>{tx.tip}</p></div>}
          <a href="#/transit" style={{ height: '52px', borderRadius: '16px', font: '600 16px var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', color: '#F2F4FA', textDecoration: 'none' }}>ดูมุมทั้งหมดในหน้าดาวจร</a>
        </div>
      </section>
    </div>
  )
}
