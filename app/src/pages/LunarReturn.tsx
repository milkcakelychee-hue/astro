// หน้า "ดวงรอบเดือน (Lunar Return)" — ตาม design/LunarReturn.dc.html
// [dev] #/lunar-return?at=2026-11-02T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import { separations, type AspectType } from '../engine/aspects.ts'
import { computeChart, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { chartAtJd, lunarReturnJds } from '../engine/returns.ts'
import { PROVINCE_TH } from '../engine/places.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { ELEMENT_TH, HOUSE_TOPIC, SIGN_TH, hhmm } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.30),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const V = '︎'
const MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const G: Partial<Record<Pt, string>> = { S: '☉', M: '☽', m: '☿', V: '♀', a: '♂', J: '♃', s: '♄', U: '♅', N: '♆', P: '♇' }
const NM: Partial<Record<Pt, string>> = { S: 'อาทิตย์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัส', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต' }
const AG: Record<AspectType, string> = { '0': '☌', '6': '⚹', '4': '□', '3': '△', '8': '☍' }
const AMOOD: Record<AspectType, string> = { '0': 'อารมณ์เข้มข้น', '6': 'มีโอกาสดี ๆ', '4': 'ใจตึง ต้องปรับ', '3': 'ใจไหลลื่น', '8': 'ต้องหาสมดุล' }
const PL10: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']
const sg = (lon: number) => Math.floor(lon / 30)
/** เวลาไทยปัดนาทีลง (floor) ตรงดีไซน์ 3/4 รอบ — ดู docs/09 */
const tp = (jd: number) => thaiParts(dateOfJd(jd))
const fd = (jd: number) => { const p = tp(jd); return `${p.d} ${MONTH[p.mo - 1]} ${p.y + 543}` }
const body = (lib: InterpLib, k: string) => { const s = text(lib, 'return', k); return s ? splitTitle(s).body : '' }

interface Rd { jd: number; end: number; c: Chart }
interface Data { name: string; prov: string; known: boolean; rs: Rd[]; now: number; lib: InterpLib }

export function LunarReturn() {
  const [d, setD] = useState<Data | null>(null)
  const [ri, setRi] = useState(0)
  const [fo, setFo] = useState(-1)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) return
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const inp = birthInput(me)
      const natal = computeChart(swe, inp)
      const js = lunarReturnJds(swe, natal, now, 6)
      const rs = js.slice(0, 5).map((jd, i) => ({ jd, end: js[i + 1]!, c: chartAtJd(swe, inp, jd) }))
      setD({ name: me.name, prov: PROVINCE_TH[me.province] ?? me.province, known: timeKnown(me), rs, now, lib })
    })().catch(() => {})
  }, [])

  const intro: [string, string][] = [
    ['คืออะไร', 'ชาร์ตที่ตั้งขึ้นทุกครั้งที่ดวงจันทร์กลับมาตำแหน่งเดิมตอนเกิด ราว 27 วันครั้ง'],
    ['ใช้ดู', 'ดูอารมณ์ ความต้องการ และเรื่องที่ใจจดจ่อในเดือนนั้น'],
    ['ทำไมสำคัญ', 'ช่วยรู้ทันจังหวะใจรายเดือน และดูว่าเรือนไหนเป็นจุดโฟกัส'],
  ]
  const R = d?.rs[ri]
  const c = R?.c
  const pl: Partial<Record<Pt, number>> = {}
  if (c) PL10.forEach((p) => { pl[p] = c.house(c.pos[p].lon) })
  const byH: Record<number, Pt[]> = {}
  PL10.forEach((p) => { if (pl[p]) (byH[pl[p]!] ??= []).push(p) })
  const hs = Object.keys(byH).map(Number).sort((a, b) => byH[b]!.length - byH[a]!.length || a - b).slice(0, 4)

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `ชาร์ตของ ${d.name}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ดวงรอบเดือน</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Lunar Return)</span>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.6, marginTop: '4px' }}>ชาร์ตของช่วงที่ดวงจันทร์กลับมาตำแหน่งเดียวกับตอนเกิด (ทุก ~27 วัน) ใช้ดูอารมณ์และเรื่องเด่นของรอบเดือนนั้น</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, x]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{x}</span></div>)}
              </div>
            </details>
          </div>

          <div role="tablist" aria-label="รอบ" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
            {['รอบนี้', 'รอบหน้า', 'อีก 2 รอบ'].map((t, i) => <button role="tab" aria-selected={ri === i} class={ri === i ? 'seg on' : 'seg'} onClick={() => { setRi(i); setFo(-1) }}>{t}</button>)}
          </div>

          {d && !d.known && <div class="card" style={{ padding: '16px', fontSize: '14px', lineHeight: 1.6, color: '#DCE0EA' }}>ดวงรอบเดือนต้องใช้เวลาเกิด เพื่อหาลัคนาและเรือนของแต่ละรอบ — เพิ่มเวลาเกิดในข้อมูลของคุณเพื่อดูหน้านี้</div>}

          {d?.known && R && c && (() => {
            const asc = sg(c.pos.A.lon), moonH = pl.M!
            const ma = separations(c.aspectPos).filter((s) => (s.a === 'M' || s.b === 'M') && PL10.includes(s.a) && PL10.includes(s.b) && s.orb <= 3).sort((x, y) => x.orb - y.orb)[0]
            const mo = ma ? (ma.a === 'M' ? ma.b : ma.a) : null
            const days = R.end - R.jd
            const cur = d.now >= R.jd && d.now < R.end
            const dn = Math.floor(d.now - R.jd)
            const tops = hs.slice(0, 3).map((n) => HOUSE_TOPIC[n]!.split(' ')[0])
            const theme = 'รอบแห่ง' + (tops.length > 1 ? tops.slice(0, -1).join(' ') + ' และ' + tops[tops.length - 1] : tops[0])
            const p = tp(R.jd)
            const keys: [string, string, string][] = [
              ['ลัคนารอบนี้', `${SIGN_TH[asc]} ${Math.floor(c.pos.A.lon % 30)}°`, `ธาตุ${ELEMENT_TH[asc % 4]}`],
              ['ดวงจันทร์', `เรือน ${moonH}`, HOUSE_TOPIC[moonH]!],
              ['มุมดวงจันทร์', ma && mo ? `${AG[ma.type]} ${NM[mo]} ${Math.floor(ma.orb)}°` : 'ไม่มีมุมแน่น', ma ? AMOOD[ma.type] : 'อารมณ์นิ่ง'],
            ]
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(60,66,100,.9),rgba(59,107,255,.30) 55%,rgba(138,92,255,.28))', border: '1px solid rgba(200,210,255,.30)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '52px', height: '52px', flex: 'none', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,#FFFFFF,#C9CEDC 70%)', boxShadow: '0 0 20px rgba(220,227,245,.5)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}><span style={{ fontSize: '12px', color: '#D6DEFF' }}>{fd(R.jd)} – {fd(R.end)}</span><span style={{ fontSize: '18px', fontWeight: 600 }}>{theme}</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#C9CEDC' }}><span>{cur ? `วันที่ ${dn + 1} ของรอบ` : 'ยังไม่เริ่ม'}</span><span>{cur ? `เหลืออีก ${Math.round(days - dn)} วัน` : 'รอบละ ~27 วัน'}</span></div>
                  <span style={{ height: '6px', borderRadius: '9px', background: 'rgba(6,7,13,.45)', overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: cur ? `${Math.round((dn / days) * 100)}%` : '0%', borderRadius: '9px', background: 'linear-gradient(90deg,#B5D6FF,#F2F4FA)' }} /></span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
                  {keys.map(([l, v, s]) => <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '10px', borderRadius: '14px', background: 'rgba(6,7,13,.40)', lineHeight: 1.3 }}><span style={{ fontSize: '11px', color: '#C9CEDC' }}>{l}</span><span style={{ fontSize: '15px', fontWeight: 600 }}>{v}</span><span style={{ fontSize: '11px', color: '#D6DEFF' }}>{s}</span></div>)}
                </div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E6E9F2' }}>{body(d.lib, `lr_asc${asc}`)} {body(d.lib, `lr_moon${moonH}`)}</p>
                <span class="lbl" style={{ color: '#C9CEDC' }}>ดวงจันทร์กลับที่เดิม {p.d} {MONTH[p.mo - 1]} {p.y + 543} เวลา {hhmm(p.hh, p.mi)} น.</span>
              </div>
            )
          })()}

          {d?.known && c && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>เรื่องเด่นของรอบนี้</span><span class="lbl">เรือนที่มีดาวในชาร์ตรอบเดือน · แตะเพื่ออ่าน</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hs.map((n, i) => {
                  const on = fo === i
                  return (
                    <button onClick={() => setFo(on ? -1 : i)} aria-expanded={on} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '12px 14px', boxSizing: 'border-box', borderRadius: '16px', background: on ? 'rgba(185,166,255,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${on ? 'rgba(185,166,255,.55)' : 'rgba(255,255,255,.08)'}`, color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <span style={{ flex: 'none', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(185,166,255,.16)', lineHeight: 1.1 }}><span style={{ fontSize: '10px', color: '#C9CEDC' }}>เรือน</span><span style={{ fontSize: '17px', fontWeight: 700, color: '#D6CEFF' }}>{n}</span></span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}><span style={{ fontSize: '14.5px', fontWeight: 600 }}>{HOUSE_TOPIC[n]}</span><span style={{ fontSize: '13px', letterSpacing: '1px', color: '#F3D46E' }}>{byH[n]!.map((p) => G[p] + V).join(' ')}</span></span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9CEDC" stroke-width="2" aria-hidden="true" style={{ flex: 'none', transform: on ? 'rotate(180deg)' : undefined }}><path d="m6 9 6 6 6-6" /></svg>
                      </span>
                      {on && <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA', padding: '10px 12px', borderRadius: '12px', background: 'rgba(6,7,13,.45)' }}>{body(d.lib, `lr_moon${n}`)} (มีดาว {byH[n]!.length} ดวงในเรือนนี้)</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {d?.known && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>รอบเดือนถัด ๆ ไป</span>
              {d.rs.slice(1, 4).map((r) => {
                const p = tp(r.jd)
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '48px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ flex: 'none', width: '28px', height: '28px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%,#FFF,#C9CEDC 70%)' }} />
                    <span style={{ display: 'flex', flexDirection: 'column', flex: 1, lineHeight: 1.35 }}><span style={{ fontSize: '14px', fontWeight: 600 }}>{fd(r.jd)} · {hhmm(p.hh, p.mi)} น.</span><span class="lbl">ลัคนา{SIGN_TH[sg(r.c.pos.A.lon)]} · จันทร์เรือน {r.c.house(r.c.pos.M.lon)}</span></span>
                  </div>
                )
              })}
            </div>
          )}
          <span class="lbl">คำนวณที่สถานที่เกิด{d ? ` (${d.prov})` : ''} · Placidus · เวลาไทย</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
