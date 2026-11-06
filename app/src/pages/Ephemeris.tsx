// หน้า "ตารางตำแหน่งดาว" — ตาม design/Ephemeris.dc.html
// [dev] #/ephemeris?at=2026-11-04T12:00 = จำลองวันนี้
import { useEffect, useRef, useState } from 'preact/hooks'
import { computeChart, type Chart } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { monthEvents, monthRows, thaiOf, type Cell, type EphEvent } from '../engine/ephemeris.ts'
import { jdOfThai } from '../engine/sky.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { SIGN_GLYPH, SIGN_TH } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const V = '︎'
const PL: Record<string, [string, string, string]> = { S: ['☉', 'ดวงอาทิตย์', '#FFC46B'], M: ['☽', 'ดวงจันทร์', '#DCE3F5'], m: ['☿', 'พุธ', '#B5D6FF'], V: ['♀', 'ศุกร์', '#FF8FB1'], a: ['♂', 'อังคาร', '#FF7A59'], J: ['♃', 'พฤหัสบดี', '#FFC46B'], s: ['♄', 'เสาร์', '#D6B87A'], U: ['♅', 'ยูเรนัส', '#5BD1FF'], N: ['♆', 'เนปจูน', '#7FB8FF'], P: ['♇', 'พลูโต', '#C98BFF'], n: ['☊', 'โหนดเหนือ', '#B9A6FF'] }
const WD = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const WDL = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const MF = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const pad = (n: number) => (n < 10 ? '0' : '') + n

interface Data { y: number; mo: number; today: number; rows: Cell[][]; ev: EphEvent[]; natal: Chart | null }

export function Ephemeris() {
  const [d, setD] = useState<Data | null>(null)
  const [sel, setSel] = useState(1)
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ;(async () => {
      const [swe, me] = await Promise.all([getBrowserSwe(), getMe()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const t = thaiOf(jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date()))
      const natal = me && timeKnown(me) ? computeChart(swe, birthInput(me)) : null
      setD({ y: t.y, mo: t.mo, today: t.d, rows: monthRows(swe, t.y, t.mo), ev: monthEvents(swe, t.y, t.mo), natal })
      setSel(t.d)
    })().catch(() => {})
  }, [])
  // เลื่อนแถบวันให้เห็นวันนี้
  useEffect(() => { const el = strip.current?.children[(d?.today ?? 1) - 1] as HTMLElement | undefined; if (el && strip.current) strip.current.scrollLeft = Math.max(0, el.offsetLeft - 20 - 50 * 3) }, [d])

  const house = (lon: number) => (d?.natal ? d.natal.house(lon) : null)
  const wd = (day: number) => new Date(Date.UTC(d!.y, d!.mo - 1, day)).getUTCDay()
  const evDay = (e: EphEvent) => thaiOf(e.jd).d
  const evText = (e: EphEvent): [string, string] => {
    const n = PL[e.p]![1], h = house(e.lon), hs = h ? ` เรือน ${h} ของคุณ` : ''
    if (e.kind === 'D') return [`${n}กลับมาเดินหน้า`, `ในราศี${SIGN_TH[e.sign]}${hs}`]
    if (e.kind === 'R') return [`${n}เริ่มเดินถอยหลัง`, `ในราศี${SIGN_TH[e.sign]}${hs}`]
    const parts = [e.p === 'S' ? `เริ่มฤดู${SIGN_TH[e.sign]}` : '', h ? `เข้าเรือน ${h} ของคุณ` : ''].filter(Boolean)
    return [`${n}ย้ายเข้าราศี${SIGN_TH[e.sign]}`, parts.join(' · ')]
  }
  const intro: [string, string][] = [['คืออะไร', 'ตารางตำแหน่งดาวทุกดวงรายวัน บอกราศี องศา และดาวที่เดินถอยหลัง'], ['ใช้ดู', 'เช็กว่าวันไหนดาวอยู่ตรงไหน ตกเรือนใดของคุณ และดาวย้ายราศีหรือเปลี่ยนทิศเมื่อไร'], ['ทำไมสำคัญ', 'เป็นข้อมูลดิบที่ทุกหน้าดูดวงล่วงหน้าใช้คำนวณ เหมาะกับคนที่อยากตรวจหรือดูละเอียดเอง']]
  const grid = { display: 'grid', gridTemplateColumns: '34px repeat(11,64px)', width: 'max-content', fontSize: '11px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `${MF[d.mo - 1]} ${d.y + 543} · เวลา 07:00 น. (00:00 UT)` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ตารางตำแหน่งดาว</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Ephemeris)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          {d && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>เลือกวัน</span><span class="lbl">เลื่อนซ้ายขวา</span></div>
                <div ref={strip} style={{ display: 'flex', gap: '6px', overflowX: 'auto', margin: '0 -20px', padding: '2px 20px 6px', scrollbarWidth: 'none' }}>
                  {d.rows.map((_, k) => {
                    const n = k + 1, on = n === sel, ev = d.ev.some((e) => evDay(e) === n)
                    return <button onClick={() => setSel(n)} aria-pressed={on} style={{ flex: 'none', width: '44px', height: '58px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', borderRadius: '14px', border: `1px solid ${on ? '#B9A6FF' : n === d.today ? 'rgba(185,166,255,.45)' : 'rgba(255,255,255,.08)'}`, background: on ? 'rgba(185,166,255,.22)' : 'rgba(255,255,255,.03)', color: '#F2F4FA', font: '500 11px var(--font)' }}><span style={{ color: '#9AA1B5' }}>{WD[wd(n)]}</span><b style={{ fontSize: '16px' }}>{n}</b><span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ev ? '#FFB08A' : 'transparent' }} /></button>
                  })}
                </div>
              </div>

              <div class="card" style={{ padding: '6px 16px 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 8px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>{`วัน${WDL[wd(sel)]}ที่ ${sel} ${MS[d.mo - 1]} ${d.y + 543}${sel === d.today ? ' · วันนี้' : ''}`}</span>{d.natal && <span class="lbl">เรือน = ในชาร์ตคุณ</span>}</div>
                {d.rows[sel - 1]!.map((c) => {
                  const q = PL[c.p]!, h = house(c.lon)
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '30px minmax(0,1fr) auto 52px', alignItems: 'center', gap: '8px', minHeight: '42px', borderTop: '1px solid rgba(255,255,255,.06)', fontSize: '13.5px' }}>
                      <span style={{ width: '28px', height: '28px', flex: 'none', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '1px solid rgba(255,255,255,.14)', color: q[2] }}>{q[0] + V}</span>
                      <span style={{ minWidth: 0 }}>{q[1]}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontVariantNumeric: 'tabular-nums' }}><span style={{ color: '#C9CEDC' }}>{SIGN_TH[c.sign]}</span><b>{`${c.deg}°${pad(c.min)}′`}</b>{c.r && <span style={{ color: '#FF8A4C', fontWeight: 700, fontSize: '11px' }}>R</span>}</span>
                      <span style={{ textAlign: 'right', color: '#9AA1B5', fontSize: '12px' }}>{h ? `เรือน ${h}` : ''}</span>
                    </div>
                  )
                })}
              </div>

              <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, paddingBottom: '6px' }}>เหตุการณ์เดือนนี้</span>
                {d.ev.map((e) => {
                  const t = thaiOf(e.jd), [n, s] = evText(e)
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '62px minmax(0,1fr)', gap: '10px', alignItems: 'center', minHeight: '44px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}><b style={{ fontSize: '13px' }}>{t.d} {MS[t.mo - 1]}</b><span class="lbl">{pad(t.hh)}:{pad(t.mi)} น.</span></span>
                      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}><span style={{ fontSize: '13.5px', fontWeight: 600 }}>{n}</span>{s && <span class="lbl">{s}</span>}</span>
                    </div>
                  )
                })}
              </div>

              <div class="card" style={{ padding: '14px 0 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>ตารางทั้งเดือน</span><span class="lbl">เลื่อนซ้ายขวา</span></div>
                <div style={{ overflowX: 'auto' }}>
                  <div style={grid}>
                    <span style={{ position: 'sticky', left: 0, background: '#15161D', padding: '6px 8px', color: '#9AA1B5' }}>วัน</span>
                    {d.rows[0]!.map((c) => <span style={{ padding: '6px 8px', color: PL[c.p]![2], fontSize: '13px', fontWeight: 600 }}>{PL[c.p]![0] + V}</span>)}
                  </div>
                  {d.rows.map((row, k) => (
                    <div style={{ ...grid, background: k + 1 === d.today ? 'rgba(185,166,255,.14)' : k % 2 ? 'rgba(255,255,255,.02)' : 'transparent' }}>
                      <span style={{ position: 'sticky', left: 0, background: '#15161D', padding: '5px 8px', color: k + 1 === d.today ? '#D6CEFF' : '#C9CEDC', fontWeight: 600 }}>{k + 1}</span>
                      {row.map((c) => <span style={{ padding: '5px 8px', color: c.r ? '#FF9A66' : '#E6E9F2', borderLeft: '1px solid rgba(255,255,255,.05)' }}>{`${SIGN_GLYPH[c.sign]} ${c.deg}°${pad(c.min)}`}</span>)}
                    </div>
                  ))}
                </div>
                <span class="lbl" style={{ padding: '0 16px' }}>สีส้ม = ถอยหลัง · พื้นม่วง = วันนี้</span>
              </div>
            </>
          )}
          <span class="lbl">คำนวณด้วย Swiss Ephemeris ตำแหน่งตอน 00:00 UT (07:00 น. เวลาไทย) ตัดเศษเป็นนาที · โหนดแบบ Mean · ตรวจกับ astro-seek แล้ว: 325 จาก 330 ช่องตรง อีก 5 ช่องเป็นดวงจันทร์ต่างกัน 1 ลิปดา</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
