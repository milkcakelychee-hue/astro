// หน้า "ดวงรอบปีนับจากวันเกิด (Solar Return)" — ตาม design/SolarReturn.dc.html
// [dev] #/solar-return?at=2026-11-01T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import type { AspectType } from '../engine/aspects.ts'
import { computeChart, type Chart, type Pt } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { chartAtJd, solarReturnJd, srAspects, type SrAspect } from '../engine/returns.ts'
import { PROVINCE_TH } from '../engine/places.ts'
import { birthInput, getMe, timeKnown } from '../data/people.ts'
import { aspectKey, loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { ELEMENT_TH, HOUSE_TOPIC, SIGN_TH, hhmm } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(255,122,89,.35),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(138,92,255,.30),transparent 70%),radial-gradient(500px 420px at 90% 1500px,rgba(59,107,255,.22),transparent 70%),#06070D'
const V = '︎'
const MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const G: Partial<Record<Pt, string>> = { S: '☉', M: '☽', m: '☿', V: '♀', a: '♂', J: '♃', s: '♄', U: '♅', N: '♆', P: '♇' }
const NM: Partial<Record<Pt, string>> = { S: 'อาทิตย์', M: 'จันทร์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต', A: 'ลัคนา', C: 'กลางฟ้า' }
const AS: Record<AspectType, [string, string, string, string, string, string]> = {
  '0': ['☌', '#F3D46E', 'rgba(243,212,110,.16)', 'กุม', 'Conjunction 0°', 'รวมพลังเป็นก้อนเดียว'], '6': ['⚹', '#7FB8FF', 'rgba(127,184,255,.16)', 'โยค', 'Sextile 60°', 'เปิดโอกาส ใช้ได้ดีถ้าลงมือ'],
  '4': ['□', '#FFB08A', 'rgba(255,138,76,.16)', 'ฉาก', 'Square 90°', 'ขัดกัน ผลักให้แก้ปัญหา'], '3': ['△', '#7FE3C0', 'rgba(79,209,165,.16)', 'ตรีโกณ', 'Trine 120°', 'ไหลลื่น เป็นพรสวรรค์'],
  '8': ['☍', '#FF8A8A', 'rgba(255,107,107,.16)', 'เล็ง', 'Opposition 180°', 'ต้องหาจุดสมดุล'],
}
const PL10: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']
const gl = (p: Pt) => (p === 'A' ? 'AC' : p === 'C' ? 'MC' : G[p]! + V)
const sg = (lon: number) => Math.floor(lon / 30)
const fdLong = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.d} ${MONTH[p.mo - 1]} ${p.y + 543}` }
const body = (lib: InterpLib, cat: 'return' | 'aspect', k: string) => { const s = text(lib, cat, k); return s ? splitTitle(s).body : '' }

/** ข้อความคลังมุม: "แก่นเรื่อง: … ด้านดี: … · ระวัง: …" → [สรุป, ด้านดี, ระวัง] */
function aspText(lib: InterpLib, a: SrAspect): [string, string, string] {
  const s = body(lib, 'aspect', aspectKey(a.a, a.b, a.type)).replace(/^แก่นเรื่อง: /, '')
  const i = s.indexOf(' ด้านดี: ')
  if (i < 0) return [s, '', '']
  const [good, bad] = s.slice(i + 9).split(' · ระวัง: ')
  return [s.slice(0, i), good ?? '', bad ?? '']
}

interface Yr { jd: number; end: number; c: Chart; age: number }
interface Data { name: string; prov: string; known: boolean; yrs: Yr[]; lib: InterpLib }

export function SolarReturn() {
  const [d, setD] = useState<Data | null>(null)
  const [yi, setYi] = useState(0)
  const [hs, setHs] = useState(-1)
  const [as, setAs] = useState(-1)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) return
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const inp = birthInput(me)
      const natal = computeChart(swe, inp)
      // ปีนี้ = รอบล่าสุดที่ผ่านมาแล้ว
      let y = thaiParts(dateOfJd(now)).y
      if (solarReturnJd(swe, natal, inp, y) > now) y--
      const js = [y, y + 1, y + 2].map((x) => solarReturnJd(swe, natal, inp, x))
      const yrs = [0, 1].map((i) => ({ jd: js[i], end: js[i + 1], c: chartAtJd(swe, inp, js[i]), age: y + i - me.y }))
      setD({ name: me.name, prov: PROVINCE_TH[me.province] ?? me.province, known: timeKnown(me), yrs, lib })
    })().catch(() => {})
  }, [])

  const intro: [string, string][] = [
    ['คืออะไร', 'ชาร์ตที่ตั้งขึ้นตอนดวงอาทิตย์กลับมาตำแหน่งเดิมทุกวันเกิด'],
    ['ใช้ดู', 'ดูธีมใหญ่ของปีนับจากวันเกิดนี้ถึงวันเกิดหน้า'],
    ['ทำไมสำคัญ', 'บอกว่าปีนี้พลังไปลงด้านไหน และมุมเด่นจะส่งผลเรื่องอะไร'],
  ]
  const Y = d?.yrs[yi]
  const c = Y?.c
  const hOf = (p: Pt) => c!.house(c!.pos[p].lon)
  const pl: Partial<Record<Pt, number>> = {}
  if (c) PL10.forEach((p) => { pl[p] = hOf(p) })
  const inHouse = (n: number) => PL10.filter((p) => pl[p] === n)
  // เรือนที่ดาวเยอะที่สุด (เท่ากันเอาเรือนแรกตามลำดับดาว)
  const most = c ? PL10.reduce<[number, number]>((b, p) => { const n = pl[p]!; const k = inHouse(n).length; return k > b[1] ? [n, k] : b }, [0, 0])[0] : 0
  const pick = hs > 0 ? hs : most
  const asps = c ? srAspects(c).filter((a) => d!.known || (a.a !== 'A' && a.a !== 'C' && a.b !== 'A' && a.b !== 'C')) : []

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '8px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `ชาร์ตของ ${d.name}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ดวงรอบปีนับจากวันเกิด</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Solar Return)</span>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.6, marginTop: '4px' }}>ชาร์ตของวินาทีที่ดวงอาทิตย์กลับมาตำแหน่งเดียวกับตอนเกิด ใช้ดูธีมของ 1 ปีนับจากวันเกิดถึงวันเกิดครั้งถัดไป</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, x]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{x}</span></div>)}
              </div>
            </details>
          </div>

          <div role="tablist" aria-label="ปี" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '16px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
            {(['ปีนี้', 'ปีหน้า'] as const).map((t, i) => <button role="tab" aria-selected={yi === i} class={yi === i ? 'seg on' : 'seg'} onClick={() => { setYi(i); setHs(-1); setAs(-1) }}>{t}{d ? ` · อายุ ${d.yrs[i].age}` : ''}</button>)}
          </div>

          {d && Y && c && (() => {
            const sunH = pl.S!, moonH = pl.M!, asc = sg(c.pos.A.lon)
            const p = thaiParts(dateOfJd(Y.jd))
            const keys: [string, string, string][] = d.known
              ? [['ลัคนาปีนี้', `${SIGN_TH[asc]} ${Math.floor(c.pos.A.lon % 30)}°`, `ธาตุ${ELEMENT_TH[asc % 4]}`], ['ดวงอาทิตย์', `เรือน ${sunH}`, HOUSE_TOPIC[sunH]], ['ดวงจันทร์', `${SIGN_TH[sg(c.pos.M.lon)]} · เรือน ${moonH}`, HOUSE_TOPIC[moonH]]]
              : [['ดวงอาทิตย์', SIGN_TH[sg(c.pos.S.lon)], ''], ['ดวงจันทร์', SIGN_TH[sg(c.pos.M.lon)], ''], ['ต้องมีเวลาเกิด', 'ลัคนา เรือน', '']]
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(255,122,89,.30),rgba(138,92,255,.32) 55%,rgba(59,107,255,.25))', border: '1px solid rgba(255,180,150,.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '52px', height: '52px', flex: 'none', borderRadius: '16px', background: 'rgba(6,7,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: '#F3D46E' }}>☉{V}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}><span style={{ fontSize: '12px', color: '#FFD9C9' }}>{fdLong(Y.jd)} – {fdLong(Y.end)}</span><span style={{ fontSize: '18px', fontWeight: 600 }}>{d.known ? `ปีแห่ง${HOUSE_TOPIC[sunH]}` : 'ธีมของปีนี้'}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
                  {keys.map(([l, v, s]) => <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '10px', borderRadius: '14px', background: 'rgba(6,7,13,.40)', lineHeight: 1.3 }}><span style={{ fontSize: '11px', color: '#C9CEDC' }}>{l}</span><span style={{ fontSize: '15px', fontWeight: 600 }}>{v}</span><span style={{ fontSize: '11px', color: '#D6CEFF' }}>{s}</span></div>)}
                </div>
                {d.known && <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#E6E9F2' }}>{body(d.lib, 'return', `sr_asc${asc}`)} {body(d.lib, 'return', `sr_sun${sunH}`)}</p>}
                <span class="lbl" style={{ color: '#C9CEDC' }}>ดวงอาทิตย์กลับที่เดิม {p.d} {MONTH[p.mo - 1]} {p.y + 543} เวลา {hhmm(p.hh, p.mi)} น.</span>
              </div>
            )
          })()}

          {d?.known && c && (
            <div class="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>ดาวในแต่ละเรือนของปีนี้</span><span class="lbl">แตะเรือนเพื่ออ่าน</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '6px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
                  const g = inHouse(n), on = hs === n
                  const st = on ? { borderColor: '#B9A6FF', background: 'rgba(185,166,255,.20)' } : g.length >= 2 ? { background: 'rgba(255,180,150,.10)', borderColor: 'rgba(255,180,150,.30)' } : {}
                  return (
                    <button class="ht" onClick={() => setHs(on ? -1 : n)} aria-pressed={on} style={{ ...st, color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}>
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '13px', fontWeight: 700, color: g.length ? '#F2F4FA' : '#6B7080' }}>{n}</span><span style={{ fontSize: '9.5px', color: '#9AA1B5' }}>{SIGN_TH[sg(c.cusps[n - 1])]}</span></span>
                      <span style={{ fontSize: '15px', letterSpacing: '1px', lineHeight: 1.2, color: '#F3D46E' }}>{g.map((p) => G[p]! + V).join(' ')}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>เรือน {pick} · {HOUSE_TOPIC[pick]}{hs > 0 ? '' : ' (เรือนที่ดาวเยอะที่สุด)'}</span>
                <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{inHouse(pick).length ? `มี${inHouse(pick).map((p) => NM[p]).join(' ')}อยู่ในเรือนนี้ ปีนี้เรื่อง${HOUSE_TOPIC[pick]}จะได้รับพลังจากดาวเหล่านี้โดยตรง` : 'ไม่มีดาวในเรือนนี้ เรื่องนี้ดำเนินไปตามปกติ ดูจากเจ้าเรือนแทน'}</span>
              </div>
            </div>
          )}

          {d && c && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>มุมเด่นในชาร์ตปีนี้</span><span class="lbl">เรียงจากแน่นที่สุด (orb 3°) · แตะเพื่ออ่านว่าส่งผลเรื่องอะไร</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', padding: '12px 14px', borderRadius: '14px', background: 'rgba(255,255,255,.04)', fontSize: '12px', lineHeight: 1.5, gap: '6px 12px', color: '#C9CEDC' }}>
                <span><b style={{ color: '#F3D46E' }}>☌{V} กุม</b> (Conjunction) รวมพลัง</span><span><b style={{ color: '#7FB8FF' }}>⚹{V} โยค</b> (Sextile) เปิดโอกาส</span><span><b style={{ color: '#FFB08A' }}>□{V} ฉาก</b> (Square) ขัดกัน</span><span><b style={{ color: '#7FE3C0' }}>△{V} ตรีโกณ</b> (Trine) ไหลลื่น</span><span><b style={{ color: '#FF8A8A' }}>☍{V} เล็ง</b> (Opposition) ต้องสมดุล</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {asps.map((a, ai) => {
                  const A = AS[a.type], on = as === ai, om = Math.floor(a.orb * 60)
                  const [sum, good, bad] = aspText(d.lib, a)
                  return (
                    <button onClick={() => setAs(on ? -1 : ai)} aria-expanded={on} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', padding: '12px 14px', boxSizing: 'border-box', borderRadius: '16px', background: on ? 'rgba(185,166,255,.08)' : 'rgba(255,255,255,.04)', border: `1px solid ${on ? 'rgba(185,166,255,.55)' : 'rgba(255,255,255,.08)'}`, color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '12px', background: 'rgba(6,7,13,.45)' }}><span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{gl(a.a)}</span><span style={{ fontSize: '15px', fontWeight: 700, color: A[1] }}>{A[0] + V}</span><span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{gl(a.b)}</span></span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}><span style={{ fontSize: '14.5px', fontWeight: 600, lineHeight: 1.35 }}>{NM[a.a]} {A[3]} {NM[a.b]}</span><span style={{ fontSize: '12px', color: '#9AA1B5' }}>{om < 30 ? 'แน่นมาก รู้สึกได้ทั้งปี' : om < 90 ? 'ชัดเจน' : 'เป็นพื้นหลัง'} · {Math.floor(om / 60)}°{String(om % 60).padStart(2, '0')}′</span></span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9CEDC" stroke-width="2" aria-hidden="true" style={{ flex: 'none', ...(on ? { transform: 'rotate(180deg)' } : {}) }}><path d="m6 9 6 6 6-6" /></svg>
                      </span>
                      <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{sum}</span>
                      {on && (
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)' }}>
                          <span style={{ fontSize: '12px', color: A[1] }}>{A[3]} ({A[4]}) · {A[5]}</span>
                          {good && <span style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.6 }}><span style={{ flex: 'none', color: '#9AA1B5', width: '78px' }}>ด้านดี</span><span style={{ color: '#F2F4FA' }}>{good}</span></span>}
                          {bad && <span style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.6 }}><span style={{ flex: 'none', color: '#9AA1B5', width: '78px' }}>ระวัง</span><span style={{ color: '#F2F4FA' }}>{bad}</span></span>}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <span class="lbl">คำนวณที่สถานที่เกิด{d ? ` (${d.prov})` : ''} · Placidus · เวลาเป็นเวลาไทย</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
