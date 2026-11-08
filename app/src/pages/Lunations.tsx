// หน้า "จันทร์ดับ จันทร์เต็ม (Lunations · Eclipses)" — ตาม design/Lunations.dc.html
// [dev] #/lunations?at=2026-11-01T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { computeChart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { LUN_ORB, lunations, type EclipseKind, type Lunation } from '../engine/lunations.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { HOUSE_TOPIC, SIGN_TH, fmtDeg, hhmm } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './lunations.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.40),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1500px,rgba(31,165,135,.20),transparent 70%),#06070D'
const V = '︎'
const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const THF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const HD = ['', 'เริ่มต้นใหม่กับภาพลักษณ์ ร่างกาย และวิธีวางตัว', 'ทบทวนรายได้ การใช้เงิน และความมั่นใจในคุณค่าตัวเอง', 'เรื่องการเรียน การสื่อสาร พี่น้อง และการเดินทางใกล้ ๆ ถูกกระตุ้น', 'บ้าน ครอบครัว และความรู้สึกปลอดภัยกลายเป็นเรื่องหลัก', 'ความรัก ความสนุก งานสร้างสรรค์ และเรื่องลูก', 'กิจวัตร งานประจำ และสุขภาพ เหมาะปรับนิสัยใหม่', 'คู่ครอง หุ้นส่วน และคนสำคัญในชีวิต', 'ความใกล้ชิด เงินร่วม หนี้ และการปล่อยวาง', 'การเรียนต่อ การเดินทางไกล ความเชื่อ', 'งาน ชื่อเสียง เป้าหมายอาชีพ', 'เพื่อน เครือข่าย และความฝันระยะยาว', 'การพัก การอยู่กับตัวเอง และเรื่องที่ซ่อนอยู่ในใจ']
const NP: Partial<Record<Pt, string>> = { S: 'อาทิตย์', M: 'จันทร์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต', A: 'ลัคนา', C: 'กลางฟ้า' }
const AS: Partial<Record<AspectType, [string, string, string]>> = { '0': ['☌', '#F3D46E', 'rgba(243,212,110,.16)'], '4': ['□', '#FFB08A', 'rgba(255,138,76,.16)'], '3': ['△', '#7FE3C0', 'rgba(79,209,165,.16)'], '8': ['☍', '#FF8A8A', 'rgba(255,107,107,.16)'] }
const ECL: Record<EclipseKind, string> = {
  sol_total: 'สุริยุปราคาเต็มดวง', sol_annular: 'สุริยุปราคาวงแหวน', sol_hybrid: 'สุริยุปราคาผสม', sol_partial: 'สุริยุปราคาบางส่วน',
  lun_total: 'จันทรุปราคาเต็มดวง', lun_partial: 'จันทรุปราคาบางส่วน', lun_penumbral: 'จันทรุปราคาเงามัว',
}
const om = (o: number) => { const m = Math.floor(o * 60); return `${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′` }
const aspT = (a: Lunation['aspects'][number]) => `${AS[a.type]![0] + V} ${NP[a.n]}${a.n === 'A' || a.n === 'C' ? '' : 'เดิม'} ${om(a.orb)}`
const title = (l: Lunation) => `${l.full ? 'จันทร์เต็มดวง' : 'จันทร์ดับ'}ในราศี${SIGN_TH[Math.floor(l.lon / 30)]}`
const when = (l: Lunation) => { const p = thaiParts(dateOfJd(l.jd)); return `${p.d} ${TH[p.mo - 1]} ${p.y + 543 - 2500} · ${hhmm(p.hh, p.mi)} น. · ${fmtDeg(l.lon)}` }
const dayKey = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.y}-${p.mo}-${p.d}` }
const iconBig = (l: Lunation) => !l.full ? { background: 'radial-gradient(circle at 35% 35%,#1A1C26,#06070D)', border: `2px solid ${l.eclipse ? '#FF8A8A' : 'rgba(220,227,245,.45)'}` } : { background: 'radial-gradient(circle at 35% 35%,#FFFFFF,#C9CEDC 70%)', boxShadow: `0 0 16px ${l.eclipse ? 'rgba(255,107,107,.7)' : 'rgba(220,227,245,.45)'}` }

/** ข้อความคลัง eclipse new{เรือน}/full{เรือน} */
function doText(lib: InterpLib, l: Lunation): string {
  const s = text(lib, 'eclipse', `${l.full ? 'full' : 'new'}${l.house}`)
  return s ? splitTitle(s).body : ''
}

interface Data { name: string; now: number; ty: number; tmo: number; tkey: string; list: Lunation[]; known: boolean; lib: InterpLib }

export function Lunations() {
  const [d, setD] = useState<Data | null>(null)
  const [tab, setTab] = useState(0)
  const [sel, setSel] = useState(-1)
  const [hf, setHf] = useState(0)
  const [view, setView] = useState(0)
  const [mi, setMi] = useState(0)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) return
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const nowD = at ? new Date(at + ':00+07:00') : new Date()
      const t = thaiParts(nowD)
      const known = timeKnown(me)
      // ช่วง 9 เดือนตามดีไซน์: ต้นเดือนนี้ถึงสิ้นเดือนที่ 9
      const a = swe.julday(t.y, t.mo, 1, -7)
      const e = new Date(Date.UTC(t.y, t.mo - 1 + 9, 1))
      const b = swe.julday(e.getUTCFullYear(), e.getUTCMonth() + 1, 1, -7)
      const list = lunations(swe, computeChart(swe, birthInput(me)), a, b, known)
      setD({ name: me.name, now: jdOfThai(swe, nowD), ty: t.y, tmo: t.mo, tkey: `${t.y}-${t.mo}-${t.d}`, list, known, lib })
    })().catch(() => {})
  }, [])

  const intro: [string, string][] = [
    ['คืออะไร', 'วันจันทร์ดับ (เริ่มต้น) และจันทร์เต็ม (ผลลัพธ์) ที่ตกลงในเรือนต่างๆ ของชาร์ตเรา'],
    ['ใช้ดู', 'ตั้งเป้าตอนจันทร์ดับ และสรุปผลหรือปล่อยวางตอนจันทร์เต็ม'],
    ['ทำไมสำคัญ', 'บอกว่าเรื่องชีวิตด้านไหนถูกกระตุ้นในแต่ละรอบเดือน'],
  ]
  const endM = d ? (d.tmo - 1 + 8) % 12 : 0
  const endY = d ? d.ty + Math.floor((d.tmo - 1 + 8) / 12) : 0
  const L = d?.list ?? []
  const hero = d ? L.find((l) => l.jd >= d.now) ?? null : null
  const cnt: Record<number, number> = {}
  L.forEach((l) => { cnt[l.house] = (cnt[l.house] ?? 0) + 1 })
  const P0 = sel >= 0 ? L[sel] : null
  const pk = (l: Lunation) => ({
    t: title(l) + (l.eclipse ? ' · ' + ECL[l.eclipse] : ''),
    asp: l.aspects.length ? 'มุมกับดาวเกิด: ' + l.aspects.map(aspT).join(' · ') : `ไม่ทำมุมกับดาวเกิด (orb ${LUN_ORB}°)`,
    d: (l.full ? 'ช่วงนี้: ' : 'ควรทำ: ') + (d ? doText(d.lib, l) : ''),
  })

  // ปฏิทิน
  const cy = d ? d.ty + Math.floor((d.tmo - 1 + mi) / 12) : 0, cm = d ? (d.tmo - 1 + mi) % 12 : 0
  const first = new Date(Date.UTC(cy, cm, 1)).getUTCDay(), nd = new Date(Date.UTC(cy, cm + 1, 0)).getUTCDate()
  const byDay = new Map<string, number>()
  L.forEach((l, i) => byDay.set(dayKey(l.jd), i))

  const items = L.map((l, i) => ({ l, i })).filter(({ l }) => (tab === 0 || (tab === 1 && !l.full) || (tab === 2 && l.full) || (tab === 3 && l.eclipse)) && (!hf || l.house === hf))
  const months: { t: string; items: typeof items }[] = []
  items.forEach((x) => { const p = thaiParts(dateOfJd(x.l.jd)); const t = `${THF[p.mo - 1]} ${p.y + 543}`; if (months[months.length - 1]?.t !== t) months.push({ t, items: [] }); months[months.length - 1].items.push(x) })

  const navBtn = (lbl: string, dPath: string, on: boolean, f: () => void) => <button onClick={f} aria-label={lbl} style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#F2F4FA', opacity: on ? 1 : 0.35 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d={dPath} /></svg></button>

  return (
    <Page background={BG}>
      <div class="pg-lun">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `ชาร์ตของ ${d.name} · ${TH[d.tmo - 1]} ${d.ty + 543} – ${TH[endM]} ${endY + 543}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>จันทร์ดับ จันทร์เต็ม</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Lunations · Eclipses)</span>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.6, marginTop: '4px' }}>ดวงจันทร์ตกเรือนไหนของคุณ บอกว่าเรื่องไหนในชีวิตกำลังเริ่มต้น (จันทร์ดับ) หรือเห็นผล (จันทร์เต็ม)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, x]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{x}</span></div>)}
              </div>
            </details>
          </div>

          {d && hero && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(40,44,70,.9),rgba(138,92,255,.30) 60%,rgba(59,107,255,.25))', border: '1px solid rgba(200,205,255,.30)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#D6CEFF' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>ครั้งถัดไป · {(() => { const n = Math.round(hero.jd - d.now); return n <= 0 ? 'วันนี้' : `อีก ${n} วัน` })()}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span data-moon="1" style={{ width: '60px', height: '60px', flex: 'none', borderRadius: '999px', boxSizing: 'border-box', ...(hero.full ? { background: 'radial-gradient(circle at 35% 35%,#FFFFFF,#C9CEDC 70%)', boxShadow: '0 0 24px rgba(220,227,245,.55)' } : { background: 'radial-gradient(circle at 35% 35%,#1A1C26,#06070D)', border: '2px solid rgba(220,227,245,.55)', boxShadow: '0 0 24px rgba(185,166,255,.35)' }) }} />
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                  <span style={{ fontSize: '19px', fontWeight: 600 }}>{title(hero)}</span>
                  <span style={{ fontSize: '13px', color: '#C9CEDC' }}>{when(hero)}</span>
                  {d.known && <span style={{ fontSize: '13px', color: '#D6CEFF', marginTop: '2px' }}>ตกเรือน {hero.house} ของคุณ · {HOUSE_TOPIC[hero.house]}</span>}
                  {hero.eclipse && <span style={{ fontSize: '13px', color: '#FF8A8A', fontWeight: 600 }}>{ECL[hero.eclipse]}</span>}
                </div>
              </div>
              {d.known && <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E6E9F2' }}>{doText(d.lib, hero)}</p>}
              {hero.aspects.length > 0 && <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{hero.aspects.map((a) => <span class="chip" style={{ color: AS[a.type]![1], background: AS[a.type]![2] }}>{aspT(a)}</span>)}</span>}
            </div>
          )}

          {d?.known && (
            <div class="card" style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>เรือนที่ถูกกระตุ้นช่วงนี้</span><span class="lbl">{L.length} ครั้ง ใน 9 เดือน</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: '6px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
                  const c = cnt[n] ?? 0, on = hf === n
                  return <button onClick={() => { setHf(on ? 0 : n); setSel(-1) }} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '56px', justifyContent: 'center', borderRadius: '12px', border: `1px solid ${on ? '#B9A6FF' : 'rgba(255,255,255,.10)'}`, background: on ? 'rgba(185,166,255,.25)' : c >= 2 ? 'rgba(185,166,255,.14)' : c ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)', color: '#F2F4FA', fontFamily: 'inherit' }}><span style={{ fontSize: '15px', fontWeight: 700 }}>{n}</span><span style={{ fontSize: '10px', color: '#C9CEDC', lineHeight: 1 }}>{c ? `${c} ครั้ง` : '–'}</span></button>
                })}
              </div>
              {hf > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(185,166,255,.35)' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>เรือน {hf} · {HOUSE_TOPIC[hf]}</span>
                  <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>เมื่อจันทร์ดับหรือจันทร์เต็มตกเรือนนี้: {HD[hf]}</span>
                  <span class="lbl">ช่วงที่เรือนนี้ถูกกระตุ้น · แตะเพื่อดูรายละเอียด</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {L.map((l, i) => ({ l, i })).filter(({ l }) => l.house === hf).map(({ l, i }) => { const p = thaiParts(dateOfJd(l.jd)); return (
                      <button onClick={() => setSel(i === sel ? -1 : i)} style={{ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '44px', padding: '0 10px', borderRadius: '12px', border: `1px solid ${i === sel ? '#B9A6FF' : 'rgba(255,255,255,.10)'}`, background: 'rgba(255,255,255,.04)', color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}><span style={{ flex: 'none', display: 'block', width: '22px', height: '22px', boxSizing: 'border-box', borderRadius: '50%', ...(l.full ? { background: '#E6E9F2' } : { background: '#06070D', border: '2px solid rgba(220,227,245,.6)' }) }} /><span style={{ flex: 1, fontSize: '13.5px' }}>{l.full ? 'จันทร์เต็ม' : 'จันทร์ดับ'}ในราศี{SIGN_TH[Math.floor(l.lon / 30)]}</span><span class="lbl">{p.d} {TH[p.mo - 1]} {p.y + 543 - 2500}</span></button>
                    ) })}
                  </div>
                  {P0 && P0.house === hf && (() => { const k = pk(P0); return <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(185,166,255,.10)', fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}><b style={{ color: '#F2F4FA' }}>{k.t}</b><br />{k.asp}<br />{k.d}</div> })()}
                </div>
              )}
              <span class="lbl">{hf ? `รายการด้านล่างกรองเฉพาะเรือน ${hf} (แตะเลขเรือนอีกครั้งเพื่อดูทั้งหมด)` : 'แตะเลขเรือนเพื่อดูความหมายและช่วงที่ถูกกระตุ้น'}</span>
            </div>
          )}

          <div role="tablist" aria-label="มุมมอง" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
            <button role="tab" aria-selected={view === 0} class={view === 0 ? 'seg on' : 'seg'} onClick={() => setView(0)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style={{ flex: 'none', verticalAlign: '-2px', marginRight: '4px' }}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></svg>รายการ</button>
            <button role="tab" aria-selected={view === 1} class={view === 1 ? 'seg on' : 'seg'} onClick={() => setView(1)}>▦ ปฏิทิน</button>
          </div>

          {d && view === 1 && (
            <div class="card" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {navBtn('เดือนก่อน', 'm15 6-6 6 6 6', mi > 0, () => { if (mi > 0) { setMi(mi - 1); setSel(-1) } })}
                <span style={{ fontSize: '17px', fontWeight: 600 }}>{THF[cm]} {cy + 543}</span>
                {navBtn('เดือนถัดไป', 'm9 6 6 6-6 6', mi < 8, () => { if (mi < 8) { setMi(mi + 1); setSel(-1) } })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', fontSize: '11px', color: '#9AA1B5', textAlign: 'center' }}>{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((w) => <span>{w}</span>)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '2px' }}>
                {Array.from({ length: first }, () => <span />)}
                {Array.from({ length: nd }, (_, k) => {
                  const day = k + 1, key = `${cy}-${cm + 1}-${day}`
                  const idx = byDay.get(key) ?? -1, l = idx >= 0 ? L[idx] : null, on = idx >= 0 && idx === sel
                  const today = key === d.tkey
                  const icon = !l ? {} : !l.full ? { background: '#06070D', border: `2px solid ${l.eclipse ? '#FF8A8A' : 'rgba(220,227,245,.6)'}` } : { background: 'radial-gradient(circle at 35% 35%,#FFF,#C9CEDC 70%)', boxShadow: `0 0 8px ${l.eclipse ? 'rgba(255,107,107,.8)' : 'rgba(220,227,245,.5)'}` }
                  return (
                    <button onClick={() => { if (idx >= 0) setSel(on ? -1 : idx) }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '56px', paddingTop: '6px', boxSizing: 'border-box', borderRadius: '12px', border: `1px solid ${on ? '#B9A6FF' : today ? 'rgba(185,166,255,.6)' : 'transparent'}`, background: on ? 'rgba(185,166,255,.25)' : l ? 'rgba(255,255,255,.05)' : 'transparent', color: l ? '#F2F4FA' : '#9AA1B5', font: '500 13px var(--font)' }}>
                      <span>{day}</span><span data-moon="1" style={{ flex: 'none', display: 'block', width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', boxSizing: 'border-box', borderRadius: '50%', ...icon }} /><span data-moon="1" style={{ fontSize: '9px', color: '#D6CEFF', lineHeight: 1 }}>{l && d.known ? `เรือน ${l.house}` : ''}</span>
                    </button>
                  )
                })}
              </div>
              <span class="lbl">● จันทร์ดับ · ○ จันทร์เต็ม · ขอบแดง = คราส · ตัวเลขใต้ไอคอน = เรือนที่ตก</span>
              {P0 && (() => { const p = thaiParts(dateOfJd(P0.jd)); if (p.y !== cy || p.mo !== cm + 1) return null; const k = pk(P0); return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(185,166,255,.35)' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{k.t}</span>
                  <span class="lbl">{when(P0)}</span>
                  {d.known && <span style={{ fontSize: '13px', color: '#D6CEFF' }}>ตกเรือน {P0.house} · {HOUSE_TOPIC[P0.house]}</span>}
                  <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{k.asp}</span>
                  {d.known && <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{k.d}</span>}
                </div>
              ) })()}
            </div>
          )}

          {d && view === 0 && (
            <>
              <div role="tablist" aria-label="ประเภท" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
                {['ทั้งหมด', '● จันทร์ดับ', '○ จันทร์เต็ม', 'คราส'].map((t, k) => <button role="tab" aria-selected={tab === k} class={tab === k ? 'seg on' : 'seg'} onClick={() => { setTab(k); setSel(-1) }}>{t}</button>)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {months.map((m) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#C9CEDC', paddingLeft: '2px' }}>{m.t}</span>
                    {m.items.map(({ l, i }) => {
                      const on = i === sel
                      return (
                        <button onClick={() => setSel(on ? -1 : i)} aria-expanded={on} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', padding: '14px', boxSizing: 'border-box', borderRadius: '18px', border: `1px solid ${on ? 'rgba(185,166,255,.55)' : l.eclipse ? 'rgba(255,107,107,.35)' : 'rgba(255,255,255,.10)'}`, background: on ? 'rgba(185,166,255,.08)' : 'rgba(255,255,255,.05)', color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                            <span data-moon="1" style={{ flex: 'none', display: 'block', width: '40px', height: '40px', boxSizing: 'border-box', borderRadius: '50%', ...iconBig(l) }} />
                            <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, lineHeight: 1.35 }}><span style={{ fontSize: '15px', fontWeight: 600 }}>{title(l)}</span><span class="lbl">{when(l)}</span></span>
                            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                              {d.known && <span style={{ width: '44px', height: '24px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, background: 'rgba(185,166,255,.18)', color: '#D6CEFF', whiteSpace: 'nowrap' }}>เรือน {l.house}</span>}
                              {l.eclipse && <span style={{ fontSize: '11px', color: '#FF8A8A', fontWeight: 600, whiteSpace: 'nowrap' }}>{ECL[l.eclipse]}</span>}
                            </span>
                          </span>
                          {d.known && <span style={{ fontSize: '13px', color: '#C9CEDC' }}>เรือน {l.house} · {HOUSE_TOPIC[l.house]}</span>}
                          {on && (
                            <span style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)' }}>
                              <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {l.aspects.map((a) => <span class="chip" style={{ color: AS[a.type]![1], background: AS[a.type]![2] }}>{aspT(a)}</span>)}
                                {!l.aspects.length && <span class="lbl">ไม่ทำมุมกับดาวเกิด (orb {LUN_ORB}°)</span>}
                              </span>
                              {d.known && <span style={{ fontSize: '13px', lineHeight: 1.65, color: '#DCE0EA' }}><b style={{ color: '#F2F4FA' }}>{l.full ? 'ช่วงนี้:' : 'ควรทำ:'}</b> {doText(d.lib, l)}</span>}
                            </span>
                          )}
                          <span class="chv" data-o={String(on)} style={{ alignSelf: 'center', margin: '2px auto 0', width: 'max-content', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9AA1B5', lineHeight: 1 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></span>
                        </button>
                      )
                    })}
                  </div>
                ))}
                {!months.length && <div class="card" style={{ padding: '20px', textAlign: 'center', fontSize: '14px', color: '#C9CEDC' }}>ไม่มีรายการในช่วงนี้</div>}
              </div>
            </>
          )}
          <span class="lbl">คำนวณจากตำแหน่งดวงอาทิตย์และดวงจันทร์จริง · เวลาเป็นเวลาไทย · มุมกับดาวเกิดใช้ orb 3° · คราสนับเมื่ออยู่ใกล้ราหู/เกตุ</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
