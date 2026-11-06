// หน้า "รอบโคจรของดาวเคราะห์" — ตาม design/Cycles.dc.html · โหนดใช้ Mean Node (CLAUDE.md) · วันที่ตรง astro-seek
// [dev] #/cycles?at=2026-11-04T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import { computeChart, type Pt } from '../engine/chart.ts'
import { cycleAngle, nextCycleEvent, nextMajorEvent, type CycleEvent, type CycleKind } from '../engine/cycles.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { birthInput, getMe } from '../data/people.ts'
import { loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const V = '︎'
const ROWS: [Pt, string, string, string, string, string][] = [
  ['a', '♂', 'ดาวอังคาร (Mars)', '2 ปี', '#FF7A6B', 'อังคาร'], ['J', '♃', 'ดาวพฤหัสบดี (Jupiter)', '12 ปี', '#FFC46B', 'พฤหัสบดี'],
  ['s', '♄', 'ดาวเสาร์ (Saturn)', '29.5 ปี', '#D6B87A', 'เสาร์'], ['n', '☊', 'จุดโหนดเหนือ (North Node)', '18.6 ปี', '#B9A6FF', 'ราหู'],
  ['c', '⚷', 'ไครอน (Chiron)', '50 ปี', '#7FE0A7', 'ไครอน'], ['U', '♅', 'ดาวยูเรนัส (Uranus)', '84 ปี', '#5BD1FF', 'ยูเรนัส'],
  ['N', '♆', 'ดาวเนปจูน (Neptune)', '165 ปี', '#7FB8FF', 'เนปจูน'], ['P', '♇', 'ดาวพลูโต (Pluto)', '248 ปี', '#C98BFF', 'พลูโต'],
]
const KL: Record<CycleKind, string> = { return: 'ครบรอบ', sq1: 'ฉาก', opp: 'เล็ง (กึ่งรอบ)', sq2: 'ฉาก' }
/** ชื่อเฉพาะตามดีไซน์ */
const SPECIAL: Partial<Record<string, string>> = { s_return: 'ครบรอบ (Saturn Return)', n_opp: 'โหนดกลับข้าง (Nodal reversal)', c_opp: 'เล็ง (Chiron opposition)', U_opp: 'เล็ง (วิกฤตกลางชีวิต)' }
const label = (p: Pt, k: CycleKind) => SPECIAL[`${p}_${k}`] ?? KL[k]
const ph = (a: number) => (a < 90 ? 'ช่วงเริ่มต้น (ก่อนฉากแรก)' : a < 180 ? 'ช่วงเติบโต (ก่อนเล็ง)' : a < 270 ? 'ช่วงเก็บเกี่ยว (หลังเล็ง)' : 'ช่วงปิดรอบ (ก่อนครบรอบ)')
const tp = (jd: number) => thaiParts(dateOfJd(jd))
const fd = (jd: number) => { const p = tp(jd); return `${p.d} ${MS[p.mo - 1]} ${p.y + 543}` }
const ym = (days: number) => { const m = Math.floor(days / 30.44); return `${Math.floor(m / 12)} ปี ${m % 12} เดือน` }

interface Row { p: Pt; angle: number; ev: CycleEvent | null }
interface Data { name: string; birth: number; now: number; rows: Row[]; major: CycleEvent | null; lib: InterpLib }

export function Cycles() {
  const [d, setD] = useState<Data | null>(null)
  useEffect(() => {
    ;(async () => {
      const [swe, lib, me] = await Promise.all([getBrowserSwe(), loadLib(), getMe()])
      if (!me) return
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const natal = computeChart(swe, birthInput(me))
      const rows = ROWS.map(([p]) => ({ p, angle: cycleAngle(swe, natal, p, now), ev: nextCycleEvent(swe, natal, p, now, 40) }))
      setD({ name: me.name, birth: natal.jd, now, rows, major: nextMajorEvent(swe, natal, now), lib })
    })().catch(() => {})
  }, [])
  const body = (k: string) => { const s = d ? text(d.lib, 'cycle', k) : null; return s ? splitTitle(s).body : '' }
  const age = d ? ym(d.now - d.birth) : ''
  const intro: [string, string][] = [['คืออะไร', 'รอบที่ดาวแต่ละดวงโคจรกลับมาทำมุมกับตำแหน่งเดิมในชาร์ตเกิด ตั้งแต่ 2 ปี (อังคาร) ถึงกว่า 200 ปี (พลูโต)'], ['ใช้ดู', 'ดูว่าแต่ละรอบชีวิตตอนนี้อยู่ช่วงไหน และหมุดหมายสำคัญถัดไปคือเมื่อไร อายุเท่าไร'], ['ทำไมสำคัญ', 'ทุกคนผ่านหมุดหมายเหล่านี้ในวัยใกล้กัน เช่น Saturn Return ตอนอายุ 29 รู้ล่วงหน้าช่วยเตรียมตัวได้']]
  const mj = d?.major ? ROWS.find((r) => r[0] === d.major!.p)! : null

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `ชาร์ตของ ${d.name} · อายุ ${age}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>รอบโคจรของดาวเคราะห์</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Planetary cycles)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          {d?.major && mj && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(50,46,40,.95),rgba(214,184,122,.22) 60%,rgba(138,92,255,.20))', border: '1px solid rgba(230,210,160,.30)' }}>
              <span style={{ fontSize: '12px', color: '#F0E2BE' }}>หมุดหมายใหญ่ถัดไป</span>
              {(() => { const l = label(d.major.p, d.major.kind); const m = /^(.*?) ?(\(.*\))?$/.exec(l)!; return <span style={{ fontSize: '20px', fontWeight: 600 }}>ดาว{mj[5]}{m[1]} {m[2] && <span style={{ fontSize: '14px', fontWeight: 400, color: '#F0E2BE' }}>{m[2]}</span>}</span> })()}
              <span style={{ fontSize: '13px', color: '#E6E9F2' }}>{fd(d.major.jd)} · อายุ {ym(d.major.jd - d.birth)} · อีก {ym(d.major.jd - d.now)}</span>
              <a href="#/timeline" style={{ fontSize: '13px', marginTop: '4px' }}>ดูในไทม์ไลน์ชีวิต →</a>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 2px' }}><span style={{ fontSize: '17px', fontWeight: 600 }}>รอบชีวิต 8 รอบของคุณ</span><span style={{ fontSize: '13px', lineHeight: 1.6, color: '#C9CEDC' }}>แต่ละกรอบบอก 4 อย่าง: ดาวดวงนั้นคุมเรื่องอะไร · รอบนี้ตอนนี้อยู่ช่วงไหน · หมุดหมายถัดไปคือเมื่อไร อายุเท่าไร · และเมื่อถึงแล้วมักเกิดอะไรขึ้น</span></div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11.5px', color: '#C9CEDC', padding: '0 2px' }}><span>แถบ = ความคืบหน้าของรอบตอนนี้</span><span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '2px', height: '10px', background: 'rgba(255,255,255,.45)' }} />¼ · ½ · ¾ รอบ (ฉาก · เล็ง · ฉาก)</span></div>

          {d && (
            <div class="card" style={{ overflow: 'hidden' }}>
              {d.rows.map((r, i) => {
                const [p, g, n, per, col, th] = ROWS[i]!
                const pc = Math.round((r.angle / 360) * 100)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderTop: i ? '1px solid rgba(255,255,255,.07)' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '34px', height: '34px', flex: 'none', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '1px solid rgba(255,255,255,.14)', color: col }}>{g + V}</span><span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}><span style={{ fontSize: '14px', fontWeight: 600 }}>{n}</span><span class="lbl">รอบละ {per} · ตอนนี้ {ph(r.angle)}</span></span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{pc}%</span></div>
                    <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,.08)' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pc}%`, borderRadius: '4px', background: col, opacity: 0.8 }} />{[25, 50, 75].map((x) => <i style={{ position: 'absolute', left: `${x}%`, top: '-2px', bottom: '-2px', width: '2px', background: 'rgba(255,255,255,.4)' }} />)}</div>
                    {r.ev && <span style={{ fontSize: '12.5px', color: '#E6E9F2' }}>ถัดไป: <b>{label(p, r.ev.kind)}</b> · {fd(r.ev.jd)} <span style={{ color: '#9AA1B5' }}>(อายุ {Math.floor((r.ev.jd - d.birth) / 365.25)})</span></span>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,.04)', fontSize: '12.5px', lineHeight: 1.6, color: '#DCE0EA' }}>
                      <span><b style={{ color: col }}>คุมเรื่อง</b> {body(`${p}_rule`).replace(`${th}คุมเรื่อง `, '')}</span>
                      {r.ev && <span><b style={{ color: col }}>เมื่อถึงหมุดหมาย</b> {body(`${p}_${r.ev.kind}`)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <span class="lbl">คำนวณด้วย Swiss Ephemeris เทียบกับตำแหน่งดาวในชาร์ตเกิด เวลาไทย · วันที่คือครั้งแรกที่มุมตรงพอดี (ดาวช้าอาจตรงพอดีซ้ำ 3 ครั้งจากการถอยหลัง) · โหนดใช้ค่าเฉลี่ย (Mean Node) · ตรงกับ astro-seek (ไครอนเว็บไม่มีให้เทียบ)</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
