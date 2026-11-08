// หน้า "ปฏิทินดวงจันทร์" — ตาม design/MoonPhases.dc.html
// [dev] #/moon-phases?at=2026-11-03T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import type { Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { moonMonth, nextNewMoon, type MoonMonth, type Voc } from '../engine/moonphases.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { PT_TH, SIGN_TH, hhmm } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const MONTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const WD = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const AN: Record<AspectType, string> = { '0': 'กุม', '6': 'โยค', '4': 'ฉาก', '3': 'ตรีโกณ', '8': 'เล็ง' }
const tp = (jd: number) => thaiParts(dateOfJd(jd))
/** เงาดวงจันทร์ (ตามดีไซน์): box-shadow inset */
function shade(e: number, size: number) {
  const ill = (1 - Math.cos((e * Math.PI) / 180)) / 2
  const off = Math.round((1 - ill) * size * (e < 180 ? -1 : 1))
  if (ill > 0.97) return 'none'
  if (ill < 0.03) return `inset 0 0 0 ${size}px #1A1C26`
  return `inset ${-off}px 0 0 0 #1A1C26`
}
const lday = (e: number) => (e < 180 ? `ขึ้น ${Math.max(1, Math.ceil(e / 12))} ค่ำ` : `แรม ${Math.max(1, Math.ceil((e - 180) / 12))} ค่ำ`)
const dur = (v: Voc) => { const m = Math.round((v.end - v.start) * 1440); return `${Math.floor(m / 60)} ชม. ${m % 60} นาที` }

interface Data { m: MoonMonth; today: number; y: number; mo: number; first: number; nextNew: number; lib: InterpLib }

export function MoonPhases() {
  const [d, setD] = useState<Data | null>(null)
  const [sel, setSel] = useState(0)
  useEffect(() => {
    ;(async () => {
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const t = tp(now)
      const m = moonMonth(swe, t.y, t.mo)
      setD({ m, today: t.d, y: t.y, mo: t.mo, first: new Date(Date.UTC(t.y, t.mo - 1, 1)).getUTCDay(), nextNew: nextNewMoon(swe, now), lib })
      setSel(t.d)
    })().catch(() => {})
  }, [])

  const day = d?.m.days[sel - 1]
  const onDay = (v: Voc, dd: number) => { const a = tp(v.start), b = tp(v.end); return (a.mo === d!.mo && a.d === dd) || (b.mo === d!.mo && b.d === dd) || (v.start < d!.m.jd0 + dd - 1 && v.end > d!.m.jd0 + dd) }
  const vd = d && day ? d.m.vocs.filter((v) => onDay(v, sel)) : []
  const nextV = d ? d.m.vocs.find((v) => tp(v.start).d > d.today && tp(v.start).mo === d.mo) : undefined
  const fmtV = (v: Voc) => { const a = tp(v.start), b = tp(v.end); return `${a.d} ${MS[a.mo - 1]} ${hhmm(a.hh, a.mi)} – ${b.d !== a.d ? `${b.d} ${MS[b.mo - 1]} ` : ''}${hhmm(b.hh, b.mi)} น.` }
  const mean = (k: string) => { const s = d ? text(d.lib, 'moon', k) : null; return s ? splitTitle(s) : { title: '', body: '' } }
  const intro: [string, string][] = [
    ['คืออะไร', 'ปฏิทินข้างขึ้นข้างแรม ราศีของดวงจันทร์รายวัน และช่วงจันทร์ว่าง (Void of Course) คือช่วงที่ดวงจันทร์ไม่ทำมุมกับดาวใดแล้วก่อนย้ายราศี'],
    ['ใช้ดู', 'เลือกวันเริ่มต้นเรื่องใหม่ เช่น เซ็นสัญญา เปิดตัวงาน นัดสำคัญ และดูจังหวะอารมณ์รายวัน'],
    ['ทำไมสำคัญ', 'ช่วงจันทร์ว่างเชื่อกันว่าสิ่งที่เริ่มมักไม่ได้ผลตามคาด ควรใช้ทบทวน พัก หรือทำงานเดิมให้เสร็จ'],
  ]
  const nn = d ? tp(d.nextNew) : null

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `${MONTH[d.mo - 1]} ${d.y + 543}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ปฏิทินดวงจันทร์</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Moon phases · Void of Course)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          {d && day && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(60,66,100,.9),rgba(59,107,255,.28) 60%,rgba(138,92,255,.25))', border: '1px solid rgba(200,210,255,.30)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span data-moon="1" style={{ flex: 'none', width: '88px', height: '88px', borderRadius: '50%', background: '#E9ECF5', boxShadow: `${shade(day.info.elong, 88)},0 0 24px rgba(220,227,245,.35)`, overflow: 'hidden' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#D6DEFF' }}><span>{sel === d.today ? 'วันนี้ · ' : 'วันที่เลือก · '}วัน{WD[(d.first + sel - 1) % 7]}ที่ {sel} {MS[d.mo - 1]} {d.y + 543}</span>{sel !== d.today && <button onClick={() => setSel(d.today)} style={{ flex: 'none', padding: '2px 10px', borderRadius: '999px', border: '1px solid rgba(214,222,255,.45)', background: 'transparent', color: '#D6DEFF', font: '500 11.5px var(--font)' }}>กลับวันนี้</button>}</span>
                  <span style={{ fontSize: '20px', fontWeight: 600 }}>{mean(day.info.phaseKey).title.replace(/ \(.*\)$/, '')} · {lday(day.info.elong)}</span>
                  <span style={{ fontSize: '13px', color: '#E6E9F2' }}>ดวงจันทร์ในราศี{SIGN_TH[day.sign]} · สว่าง {Math.round(day.info.illum * 100)}%</span>
                </div>
              </div>
              <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#E6E9F2' }}>{mean(day.info.phaseKey).body}</span>
              {nn && <span style={{ fontSize: '12px', color: '#C9CEDC' }}>จันทร์ดับครั้งถัดไป {nn.d} {MS[nn.mo - 1]} {hhmm(nn.hh, nn.mi)} น.</span>}
            </div>
          )}

          {d && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', background: 'rgba(255,176,138,.08)', border: '1px solid rgba(255,176,138,.30)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}><span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FFB08A' }} />จันทร์ว่างครั้งถัดไป (หลังวันนี้) <span style={{ fontWeight: 400, color: '#FFD0BA' }}>(Void of Course)</span></span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{nextV ? `${fmtV(nextV)} · ${dur(nextV)}` : 'ไม่มีในเดือนนี้แล้ว'}</span>
              <span style={{ fontSize: '12.5px', lineHeight: 1.6, color: '#C9CEDC' }}>จันทร์ว่างคือช่วงสั้นๆ ไม่กี่ชั่วโมง ที่ดวงจันทร์ "ว่างงาน" ก่อนย้ายราศี ไม่ได้ร้าย แต่เรื่องที่เริ่มในช่วงนี้มักไม่ไปไหน</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', borderRadius: '12px', background: 'rgba(124,224,167,.10)', border: '1px solid rgba(124,224,167,.35)' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#9FEAC0' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style={{ flex: 'none', verticalAlign: '-2px', marginRight: '4px' }}><path d="M5 12l5 5L20 7" /></svg>นอกช่วงจันทร์ว่าง</span><span style={{ fontSize: '12px', lineHeight: 1.55, color: '#DCE0EA' }}>เหมาะลงมือเรื่องใหม่ เซ็นสัญญา เปิดตัว นัดสำคัญ</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', borderRadius: '12px', background: 'rgba(255,176,138,.10)', border: '1px solid rgba(255,176,138,.40)' }}><span style={{ fontSize: '13px', fontWeight: 600, color: '#FFB08A' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style={{ flex: 'none', verticalAlign: '-2px', marginRight: '4px' }}><path d="M6 6l12 12M18 6L6 18" /></svg>ในช่วงจันทร์ว่าง</span><span style={{ fontSize: '12px', lineHeight: 1.55, color: '#DCE0EA' }}>เลี่ยงเริ่มเรื่องใหม่ ใช้พัก ทบทวน ทำงานเดิมให้เสร็จ</span></div>
              </div>
              <span class="lbl" style={{ lineHeight: 1.5 }}>วันที่เป็นช่องส้มยังใช้ได้ทั้งวัน แค่เลี่ยงชั่วโมงที่เป็นจันทร์ว่าง</span>
            </div>
          )}

          {d && (
            <div class="card" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>{MONTH[d.mo - 1]} {d.y + 543}</span><span class="lbl">แตะวันเพื่อดู</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', fontSize: '11px', color: '#9AA1B5', textAlign: 'center' }}>{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((w) => <span>{w}</span>)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '4px' }}>
                {Array.from({ length: d.first }, () => <span />)}
                {d.m.days.map((x) => {
                  const hasV = d.m.vocs.some((v) => onDay(v, x.d)), on = x.d === sel
                  return (
                    <button onClick={() => setSel(x.d)} style={{ height: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: 0, boxSizing: 'border-box', borderRadius: '12px', border: `1.5px solid ${on ? '#F2F4FA' : 'transparent'}`, background: hasV ? 'rgba(255,176,138,.30)' : 'rgba(255,255,255,.06)', color: '#F2F4FA', font: '600 13px var(--font)', lineHeight: 1.1 }}>
                      <span style={{ color: x.d === d.today ? '#D6CEFF' : '#F2F4FA' }}>{x.d}</span>
                      <span data-moon="1" style={{ flex: 'none', display: 'block', width: '14px', height: '14px', borderRadius: '50%', background: '#E9ECF5', boxShadow: shade(x.info.elong, 14), overflow: 'hidden' }} />
                      <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1, color: '#C9CEDC' }}>{SIGN_TH[x.sign]}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11.5px', color: '#C9CEDC', padding: '4px 4px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,176,138,.45)' }} />ช่องส้ม = มีจันทร์ว่างบางชั่วโมง</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '12px', height: '12px', borderRadius: '3px', border: '1.5px solid #F2F4FA', boxSizing: 'border-box' }} />วันที่เลือก · เลขม่วง = วันนี้</span>
                <span>ตัวเล็กใต้ดวงจันทร์ = ราศีของดวงจันทร์</span>
              </div>
            </div>
          )}

          {d && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>ช่วงจันทร์ว่าง · {sel} {MS[d.mo - 1]}{sel === d.today ? ' (วันนี้)' : ''}</span>
              {vd.length > 0 ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ position: 'relative', height: '16px', borderRadius: '8px', background: 'rgba(124,224,167,.22)', overflow: 'hidden' }}>
                      {vd.map((v) => { const s0 = d.m.jd0 + sel - 1; const a = Math.max(0, v.start - s0), b = Math.min(1, v.end - s0); return <span style={{ position: 'absolute', top: 0, bottom: 0, left: `${a * 100}%`, width: `${Math.max(1.5, (b - a) * 100)}%`, background: 'linear-gradient(90deg,#FFB08A,#FF8A65)' }} /> })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#9AA1B5' }}><span>00</span><span>06</span><span>12</span><span>18</span><span>24 น.</span></div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px', color: '#C9CEDC' }}><span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#FF8A65' }} />จันทร์ว่าง · เลี่ยงเริ่มเรื่องใหม่</span><span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '12px', height: '8px', borderRadius: '2px', background: 'rgba(124,224,167,.45)' }} />ใช้ได้ตามปกติ</span></div>
                  </div>
                  {vd.map((v) => {
                    const a = tp(v.start), b = tp(v.end)
                    const t0 = a.d === sel && a.mo === d.mo ? hhmm(a.hh, a.mi) : '00:00', t1 = b.d === sel && b.mo === d.mo ? hhmm(b.hh, b.mi) : '24:00'
                    const multi = a.d !== b.d
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,176,138,.10)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><span style={{ fontSize: '14px', fontWeight: 600 }}>{t0} – {t1} น.</span><span style={{ fontSize: '12px', color: '#FFB08A', fontWeight: 600, whiteSpace: 'nowrap' }}>{dur(v)}</span></div>
                        <span class="lbl">{multi ? `ทั้งช่วง ${fmtV(v)} · ` : ''}มุมสุดท้าย: {AN[v.type]}{PT_TH[v.p as Pt]} → เข้าราศี{SIGN_TH[v.sign]}</span>
                      </div>
                    )
                  })}
                </>
              ) : (
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(124,224,167,.10)', border: '1px solid rgba(124,224,167,.35)', fontSize: '13.5px', lineHeight: 1.6, color: '#DCE0EA' }}><b style={{ color: '#9FEAC0' }}>ไม่มีช่วงจันทร์ว่าง</b><br />วันที่เลือกใช้เริ่มเรื่องใหม่ได้ตามปกติทั้งวัน</div>
              )}
            </div>
          )}
          <span class="lbl">คำนวณจากตำแหน่งดวงจันทร์จริง เวลาไทย · จันทร์ว่างนับมุมหลัก 5 มุมกับดาวอาทิตย์ถึงพลูโต</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
