// หน้า "ชาร์ตของฉัน" — ตาม design/Main.dc.html (หมวด "ภาพรวม")
import { useEffect, useState } from 'preact/hooks'
import { aspectsOf, type Aspect } from '../engine/aspects.ts'
import { computeChart, PLANETS, type Chart, type Pt } from '../engine/chart.ts'
import { dominantElements, dominants, signature, signOf, elementOfSign, type Dominants } from '../engine/dominants.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { PROVINCE_TH, provinceByName } from '../engine/places.ts'
import { birthInput, getMe, getPerson, timeKnown, type Person } from '../data/people.ts'
import {
  ASPECT_GLYPH, ELEMENT_COLOR, ELEMENT_EN, ELEMENT_LIGHT, ELEMENT_TH, MODALITY_EN, MODALITY_TH, PT_EN, PT_TH, SIGN_EN, SIGN_GLYPH, SIGN_TH,
  degMin, fmtDeg, fmtLatLon, glyph, hhmm, thaiDate,
} from '../ui/astro-labels.ts'
import { ChartWheel } from '../ui/ChartWheel.tsx'
import { c, isLightTheme, setRenderLight } from '../ui/theme.ts'
import { BackLink, HelpHead, Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import { MainEmpty } from './MainEmpty.tsx'
import { PlanetSheet } from './PlanetSheet.tsx'
import { CategorySheet, type Cat } from './CategorySheet.tsx'
import { loadLib, type InterpLib } from '../lib/interp.ts'
import './main.css'
import './main-light.css'

const BG =
  'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 200px,rgba(31,165,135,.38),transparent 70%),radial-gradient(500px 420px at 60% 640px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 500px at 0% 1900px,rgba(138,92,255,.20),transparent 70%),#06070D'

const BG_LIGHT =
  'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.22),transparent 70%),radial-gradient(460px 380px at -10% 200px,rgba(31,165,135,.18),transparent 70%),radial-gradient(500px 420px at 60% 640px,rgba(59,107,255,.14),transparent 70%),radial-gradient(500px 500px at 0% 1900px,rgba(138,92,255,.10),transparent 70%),#F3F4F8'

const Chev = (p: { open?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style={p.open ? { transform: 'rotate(180deg)' } : undefined}><path d="m6 9 6 6 6-6" /></svg>
)

interface Data {
  person: Person
  chart: Chart
  aspects: Aspect[]
  dom: Dominants
}

/** ชาร์ตของคนอื่นเปิดในแท็บบุคคล: #/people?id=<คน> */
export function Main(props: { tab?: 'main' | 'people' } = {}) {
  const tab = props.tab ?? 'main'
  const [data, setData] = useState<Data | null | 'none'>(null)
  const [err, setErr] = useState<string | null>(null)
  const load = () => {
    // #/main?id=<คน> = ชาร์ตของคนอื่น (แตะจากหน้าบุคคล)
    const id = new URLSearchParams(location.hash.split('?')[1] ?? '').get('id')
    ;(id ? getPerson(id) : getMe())
      .then(async (person) => {
        if (!person) return setData('none')
        const swe = await getBrowserSwe()
        const inp = birthInput(person)
        const chart = computeChart(swe, inp)
        setData({ person, chart, aspects: aspectsOf(swe, inp, chart), dom: dominants(chart) })
      })
      .catch((e: unknown) => setErr(String(e)))
  }
  useEffect(load, [])

  if (err) return <Page background={BG}><div style={{ padding: '62px 20px', color: c('#FF9A9A') }}>{err}</div><TabBar active={tab} /></Page>
  if (data === 'none') return <MainEmpty background={BG} onLoaded={load} />
  if (!data) return <Page background={BG}><TabBar active={tab} /></Page>
  return <MainView {...data} navTab={tab} />
}

function MainView({ person, chart, aspects, dom, navTab }: Data & { navTab: 'main' | 'people' }) {
  const base = person.isMe ? '#/main' : '#/people?id=' + person.id
  // โทนสว่างตาม design/ChartLight.dc.html
  const light = isLightTheme()
  setRenderLight(light)
  // Sheet: #/main?p=<จุด> (แตะดาวในวงชาร์ต)
  const qs = new URLSearchParams(location.hash.split('?')[1] ?? '')
  const sheetPt = (qs.get('p') ?? '') as Pt
  const cat = (qs.get('cat') ?? '') as Cat | ''
  const [lib, setLib] = useState<InterpLib | null>(null)
  useEffect(() => {
    if ((sheetPt || cat) && !lib) loadLib().then(setLib)
  }, [sheetPt, cat])
  const known = timeKnown(person)
  // ผู้ใช้ขอ: แตะ Big Three / ดาวเด่น → เปิด Sheet อ่านเพิ่มเติม
  const sheetHref = (p: Pt) => base + (person.isMe ? '?' : '&') + 'p=' + p
  const prov = provinceByName(person.province)!
  const [o3, setO3] = useState(false)
  const [o4, setO4] = useState(false)

  const label = `${person.name} · ${thaiDate(person.y, person.mo, person.d)}${known ? ` · ${hhmm(person.hh!, person.mi!)} น.` : ''} · ${PROVINCE_TH[person.province]}`

  // ตารางดาว: ดาว 10 + โหนด ลิลิธ ไครอน + ลัคนา กลางฟ้า
  const rowsPts: Pt[] = [...PLANETS, 'n', 'L', 'c', ...(known ? (['A', 'C'] as Pt[]) : [])]
  const rows = rowsPts.map((p) => {
    const lon = chart.pos[p].lon
    const s = signOf(lon)
    const { deg, min } = degMin(lon)
    return {
      g: glyph(p), n: PT_TH[p], d: String(deg).padStart(2, '0') + '°', s: SIGN_GLYPH[s], m: String(min).padStart(2, '0') + '′',
      h: known ? String(p === 'A' ? 1 : p === 'C' ? 10 : chart.house(lon)) : '–', r: chart.pos[p].speed < 0 ? 'R' : '', c: c(ELEMENT_COLOR[elementOfSign(s)]),
    }
  })
  const shownRows = o3 ? rows : rows.slice(0, 3)

  // ธาตุ
  const el = dominantElements(chart, dom)
  const elTotal = el.reduce((t, e) => t + e.total, 0)
  const elMax = Math.max(...el.map((e) => e.total))
  const sig = signature(chart)

  // ดาวเด่น
  const ranked = [...dom.rows].sort((a, b) => b.total - a.total)
  const top = ranked[0]!
  const pct = (v: number) => ((v / dom.sum) * 100).toFixed(2) + '%'
  const DL = ['ราศี', 'เรือน', 'แกน', 'เจ้าเรือน', 'มุม']

  // มุม
  const planetAsp = aspects.filter((a) => PLANETS.includes(a.a) && PLANETS.includes(a.b)).length
  const CHIP_PTS = new Set<Pt>([...PLANETS, 'n', 'L', 'c', 'A', 'C'])
  const tight = aspects.filter((a) => CHIP_PTS.has(a.a) && CHIP_PTS.has(a.b)).sort((x, y) => x.orb - y.orb).slice(0, 3)

  const big3: { p: Pt; color: string; role: string; en: string }[] = [
    { p: 'S', color: c('#F3D46E'), role: 'ตัวตน', en: 'Sun' },
    { p: 'M', color: c('#DCE3F5'), role: 'อารมณ์', en: 'Moon' },
    ...(known ? [{ p: 'A' as Pt, color: c('#7FB8FF'), role: 'ภาพลักษณ์', en: 'ASC' }] : []),
  ]

  const TILES: [string, string, preact.JSX.Element][] = [
    ['planets', 'ดาว', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4" /><ellipse cx="12" cy="12" rx="10" ry="4" /></svg>],
    ['houses', 'เรือน', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 11 12 4l8 7v9H4z" /><path d="M10 20v-5h4v5" /></svg>],
    ['aspects', 'มุมดาว', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><circle cx="12" cy="5" r="2" /><path d="M6.5 16.5 11 6.8M13 6.8l4.5 9.7M7 18h10" /></svg>],
    ['stats', 'สถิติ', <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7" /></svg>],
  ]

  return (
    <Page background={light ? BG_LIGHT : BG} light={light}>
      {/* ชาร์ตของคนอื่น: ปุ่มย้อนกลับไปรายชื่อ (คอมโพเนนต์กลางจาก DesignSystem) */}
      {!person.isMe && <BackLink href="#/people" label="บุคคล" />}
      <div class={light ? 'pg-main light' : 'pg-main'} style={{ padding: person.isMe ? '62px 20px 150px' : '4px 20px 150px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* ผู้ใช้ขอ: ปุ่ม ? ของหัวข้อหน้าชิดขวาสุดทุกหน้า (flex:1 ให้กล่องหัวข้อเต็มความกว้าง) */}
          <div style={{ flex: 1, position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{person.isMe ? person.name : 'ชาร์ตของ'}</span>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>{person.isMe ? 'ชาร์ตของฉัน' : person.name}</h1>
            {/* ผู้ใช้ขอ: วันเกิดเป็นหัวข้อรองที่ใหญ่ขึ้น (เดิม 12px อยู่เหนือหัวข้อ) */}
            <span style={{ fontSize: '15px', fontWeight: 500, color: c('#DCE0EA'), marginTop: '2px' }}>{label.slice(person.name.length + 3)}</span>
            <span class="lbl">{fmtLatLon(prov.latDeg, prov.latMin, prov.lonDeg, prov.lonMin)}{known ? ' · ระบบเรือน Placidus' : ' · ไม่ทราบเวลาเกิด (ซ่อนลัคนาและเรือน)'}</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: 0, top: '28px' /* กึ่งกลางกับ h1 */, width: '30px', height: '30px', borderRadius: '50%', border: c('1px solid rgba(200,210,255,.35)'), background: c('rgba(255,255,255,.06)'), color: c('#D6DEFF'), display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div data-intro style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: c('rgba(255,255,255,.05)'), border: c('1px solid rgba(200,210,255,.16)'), fontSize: '13.5px', lineHeight: '1.6' }}>
                {[['คืออะไร', 'ชาร์ตกำเนิด (Natal chart) คือภาพท้องฟ้าตอนที่เราเกิด'], ['ใช้ดู', 'ดูนิสัยพื้นฐาน จุดแข็ง จุดอ่อน และเรื่องชีวิตแต่ละด้าน'], ['ทำไมสำคัญ', 'เป็นฐานของการดูดวงทุกแบบ ทุกหน้าคำนวณเทียบกับชาร์ตนี้']].map(([k, v]) => (
                  <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: c('#9AA1B5') }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: c('#E6E9F2') }}>{v}</span></div>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <HelpHead k="wheel" aria="วงชาร์ตคืออะไร" head={<h2 class="h2">วงชาร์ตเกิด <span class="lbl" style={{ fontWeight: 400 }}>(Birth Chart)</span></h2>} />
          <div class="card" style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: '10px', background: c('rgba(12,14,24,.55)') }}>
            <ChartWheel chart={chart} aspects={aspects} showHouses={known} label={`วงชาร์ตเกิด ${label}`} onPick={(p) => (location.hash = base + (person.isMe ? '?' : '&') + 'p=' + p)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '6px 12px', fontSize: '12px', color: c('#C9CEDC') }}>
              {[[c('#4FD1A5'), 'ส่งเสริม (Trine 120°)'], [c('#7FB8FF'), 'เปิดโอกาส (Sextile 60°)'], [c('#FF8A4C'), 'ท้าทาย (Square 90°)'], [c('#FF6B6B'), 'ตรงข้าม (Opposition 180°)']].map(([c, t]) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '16px', height: '2px', background: c }} />{t}</span>
              ))}
            </div>
            <p style={{ margin: 0, textAlign: 'center', fontSize: '12px', color: c('#9AA1B5') }}>แตะดาว ราศี หรือเส้น เพื่อดูคำอธิบาย</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <HelpHead k="big3" aria="Big Three คืออะไร" head={<h2 class="h2">3 ตำแหน่งหลัก <span class="lbl" style={{ fontWeight: 400 }}>(Big Three)</span></h2>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
            {big3.map((b) => {
              const lon = chart.pos[b.p].lon
              const s = signOf(lon)
              return (
                <a href={sheetHref(b.p)} class="card" style={{ padding: '14px 12px', display: 'grid', gridTemplateRows: '28px 18px 18px 24px 18px 20px', gap: '2px', textDecoration: 'none', color: c('#F2F4FA') }}>
                  {b.p === 'A'
                    ? <span style={{ fontSize: '15px', fontWeight: 700, lineHeight: '28px', color: b.color }}>AC</span>
                    : <span style={{ fontSize: '22px', lineHeight: '28px', color: b.color }}>{glyph(b.p)}</span>}
                  <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: '18px', color: c('#C9CEDC') }}>{PT_TH[b.p]} <span style={{ fontWeight: 400, color: c('#9AA1B5') }}>({b.en})</span></span>
                  <span class="lbl" style={{ lineHeight: '18px' }}>{b.role}</span>
                  <span style={{ fontSize: '16px', fontWeight: 600, lineHeight: '24px' }}>{SIGN_TH[s]} <span style={{ color: c(ELEMENT_COLOR[elementOfSign(s)]) }}>{SIGN_GLYPH[s]}</span></span>
                  <span class="lbl" style={{ lineHeight: '18px' }}>{fmtDeg(lon)}{known ? ` · เรือน ${b.p === 'A' ? 1 : chart.house(lon)}` : ''}</span>
                  <span style={{ fontSize: '12px', lineHeight: '20px', color: c('#7FB8FF') }}>อ่านเพิ่ม ›</span>
                </a>
              )
            })}
          </div>
          {/* การ์ดสรุปตัวตน: รอข้อความหมวดใหม่จาก lib/gen2.py (ผู้ใช้อนุมัติแนวทางแล้ว) */}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span class="sec">เลือกหมวดที่จะดู</span>
          <div aria-label="หมวดชาร์ต" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '8px' }}>
            {TILES.map(([id, name, icon]) => (
              <a href={base + (person.isMe ? '?' : '&') + 'cat=' + id} class="tile" style={{ textDecoration: 'none' }}>{icon}{name}</a>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 class="h2" style={{ fontSize: '24px' }}>ภาพรวม</h2><span class="lbl">ตรงกับ astro-seek</span></div>

          <div class="card" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <HelpHead k="table" aria="อ่านตารางนี้อย่างไร" style={{ padding: '0 4px' }} head={<span style={{ fontSize: '15px', fontWeight: 600 }}>ตำแหน่งดาวและจุดสำคัญ <span class="lbl" style={{ fontWeight: 400 }}>(Planets &amp; Points)</span></span>} />
            <div style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr) 92px 36px', fontSize: '11px', color: c('#9AA1B5'), padding: '0 4px' }}><span /><span>ดาว/จุด</span><span>ตำแหน่ง</span><span style={{ textAlign: 'right' }}>เรือน</span></div>
            {shownRows.map((p) => (
              <div style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr) 92px 36px', alignItems: 'center', minHeight: '34px', padding: '0 4px', borderTop: c('1px solid rgba(255,255,255,.06)'), fontSize: '14px' }}>
                <span style={{ fontSize: '16px', color: c('#F2F4FA') }}>{p.g}</span>
                <span>{p.n} <span style={{ fontSize: '11px', color: c('#FF8A4C') }}>{p.r}</span></span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{p.d} <span style={{ color: p.c }}>{p.s}</span> {p.m}</span>
                <span style={{ textAlign: 'right', color: c('#C9CEDC') }}>{p.h}</span>
              </div>
            ))}
            <button class="more" style={{ padding: '0 4px', alignSelf: 'stretch', justifyContent: 'center', borderTop: c('1px solid rgba(255,255,255,.06)'), borderRadius: 0 }} onClick={() => setO3(!o3)}>{o3 ? 'แสดงน้อยลง' : `แสดงทั้งหมด ${rows.length} จุด`} <Chev /></button>
            <span class="lbl" style={{ padding: '0 4px' }}>R = ถอยหลัง (Retrograde) ดาวดูเหมือนเดินย้อนเมื่อมองจากโลก</span>
          </div>

          <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <HelpHead k="elements" aria="ธาตุคืออะไร" head={<span style={{ fontSize: '15px', fontWeight: 600 }}>ธาตุในชาร์ต <span class="lbl" style={{ fontWeight: 400 }}>(Elements)</span></span>} />
            <span class="lbl">คิดเป็นคะแนนแบบเดียวกับส่วน Dominants ของ astro-seek</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {el.map((e, i) => (
                <div style={{ display: 'grid', gridTemplateColumns: '78px minmax(0,1fr) 78px', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: c(ELEMENT_COLOR[i]), fontWeight: 600 }}>{ELEMENT_TH[i]} <span class="lbl" style={{ fontWeight: 400 }}>({ELEMENT_EN[i]})</span></span>
                  <span style={{ height: '14px', borderRadius: '999px', background: c('rgba(255,255,255,.06)'), overflow: 'hidden' }}><span style={{ display: 'block', width: `${(e.total / elMax) * 100}%`, height: '100%', borderRadius: '999px', background: `linear-gradient(90deg,${c(ELEMENT_COLOR[i])},${c(ELEMENT_LIGHT[i])})` }} /></span>
                  <span style={{ fontSize: '13px', textAlign: 'right', color: c('#C9CEDC') }}>{e.total} · {((e.total / elTotal) * 100).toFixed(2)}%</span>
                </div>
              ))}
            </div>
            {/* ย่อหน้าสรุปธาตุ: รอข้อความหมวดใหม่จาก lib/gen2.py */}
            {!sig.ambiguous && (() => {
              const e = elementOfSign(sig.sign)
              const m = sig.sign % 3
              const hex = c(ELEMENT_COLOR[e]!)
              const rgb = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16)).join(',')
              return (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: c(`rgba(${rgb},.10)`), border: c(`1px solid rgba(${rgb},.30)`) }}>
                  <span style={{ fontSize: '20px', color: hex }}>{SIGN_GLYPH[sig.sign]}</span>
                  <span style={{ fontSize: '13px', lineHeight: '1.5', color: c('#DCE0EA') }}><b>ราศีประจำชาร์ต <span style={{ fontWeight: 400, color: c('#9AA1B5') }}>(Signature Sign)</span>: {SIGN_TH[sig.sign]} <span style={{ fontWeight: 400, color: c('#9AA1B5') }}>({SIGN_EN[sig.sign]})</span></b><br />{sig.withAsc ? 'ดาว 10 ดวงกับลัคนา' : 'ดาว 10 ดวง'}อยู่ธาตุ{ELEMENT_TH[e]} {sig.elementCount} และลักษณะ{MODALITY_TH[m]} ({MODALITY_EN[m]}) {sig.modalityCount}</span>
                </div>
              )
            })()}
            <span class="lbl">รวม {elTotal} คะแนน</span>
          </div>

          <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <HelpHead k="dominant" aria="ดาวเด่นคืออะไร" head={<span style={{ fontSize: '15px', fontWeight: 600 }}>ดาวเด่นในชาร์ต <span class="lbl" style={{ fontWeight: 400 }}>(Dominant Planets)</span></span>} />
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: c('#C9CEDC') }}>ดาวแต่ละดวงได้คะแนนตามตำแหน่ง ราศี เรือน และมุมที่ทำ ดาวคะแนนสูงคือพลังที่คุณใช้บ่อยที่สุด</p>
            <a href={sheetHref(top.planet)} style={{ textDecoration: 'none', color: c('#F2F4FA'), display: 'flex', gap: '14px', alignItems: 'center', padding: '14px', borderRadius: '16px', background: c('linear-gradient(120deg,rgba(138,92,255,.30),rgba(31,165,135,.20))'), border: c('1px solid rgba(170,160,255,.35)') }}>
              <span style={{ width: '52px', height: '52px', flex: 'none', borderRadius: '999px', background: c('rgba(6,7,13,.5)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', color: c('#F3D46E') }}>{glyph(top.planet)}</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '12px', color: c('#D6CEFF') }}>อันดับ 1</span><span style={{ fontSize: '17px', fontWeight: 600 }}>{PT_TH[top.planet]} <span class="lbl" style={{ fontWeight: 400 }}>({PT_EN[top.planet]})</span></span><span style={{ fontSize: '13px', color: c('#DCE0EA') }}>{top.total} คะแนน · {pct(top.total)}</span></div>
              <span style={{ fontSize: '12px', color: c('#7FB8FF') }}>อ่านเพิ่ม ›</span>
            </a>
            {o4 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ranked.slice(1).map((d) => {
                  const parts = [d.sign, d.house, d.angle, d.ruler, d.aspects].map((v, i) => (v ? `${DL[i]} +${v}` : null)).filter(Boolean).join(' · ')
                  return (
                    <>
                      <a href={sheetHref(d.planet)} style={{ textDecoration: 'none', color: c('#F2F4FA'), display: 'grid', gridTemplateColumns: '22px 122px minmax(0,1fr) 72px', alignItems: 'center', gap: '8px', minHeight: '36px', borderTop: c('1px solid rgba(255,255,255,.06)') }}>
                        <span style={{ fontSize: '16px' }}>{glyph(d.planet)}</span>
                        <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{PT_TH[d.planet]} <span class="lbl">{PT_EN[d.planet]}</span></span>
                        <span style={{ height: '8px', borderRadius: '999px', background: c('rgba(255,255,255,.06)'), overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${Math.round((d.total / top.total) * 100)}%`, borderRadius: '999px', background: c('linear-gradient(90deg,#8A5CFF,#6FE0C0)') }} /></span>
                        <span style={{ fontSize: '12px', textAlign: 'right', color: c('#C9CEDC'), fontVariantNumeric: 'tabular-nums' }}>{d.total} · {pct(d.total)}</span>
                      </a>
                      <span class="lbl" style={{ padding: '0 0 8px 30px', marginTop: '-6px' }}>{parts}</span>
                    </>
                  )
                })}
              </div>
            )}
            <button class="more" style={{ alignSelf: 'stretch', justifyContent: 'center', borderTop: c('1px solid rgba(255,255,255,.06)'), borderRadius: 0 }} onClick={() => setO4(!o4)}>{o4 ? 'ซ่อนอันดับอื่น' : 'ดูอันดับ 2–10'} <Chev open={o4} /></button>
            <span class="lbl">รวม {dom.sum} คะแนน · คิดแบบ Modern ตรงกับ astro-seek · คะแนนมาจาก ราศี (Sign) · เรือน (House) · แกนชาร์ต (Angle) · เจ้าเรือน (Ruler) · มุม (Aspects)</span>
            {/* ย่อหน้าดาวเด่น 3 อันดับ: รอข้อความหมวดใหม่จาก lib/gen2.py */}
          </div>

          <a href="#/aspects" class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', textDecoration: 'none', color: c('#F2F4FA') }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>มุมดาวทั้งหมด <span class="lbl" style={{ fontWeight: 400 }}>(Aspects)</span></span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AA1B5" stroke-width="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px' }}>
              <div style={{ padding: '12px', borderRadius: '14px', background: c('rgba(255,255,255,.04)'), display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '24px', fontWeight: 600 }}>{planetAsp}</span><span class="lbl">มุมระหว่างดาว (Planet aspects)</span></div>
              <div style={{ padding: '12px', borderRadius: '14px', background: c('rgba(255,255,255,.04)'), display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '24px', fontWeight: 600 }}>{aspects.length - planetAsp}</span><span class="lbl">มุมกับจุดอื่น (Other aspects)</span></div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
              {tight.map((a) => <span style={{ padding: '3px 9px', borderRadius: '999px', background: c('rgba(185,166,255,.16)'), color: c('#E4DCFF') }}>{glyph(a.a)} {ASPECT_GLYPH[a.type]} {glyph(a.b)} {Math.floor(a.orb)}°</span>)}
              <span style={{ padding: '3px 9px', borderRadius: '999px', background: c('rgba(255,255,255,.08)'), color: c('#C9CEDC') }}>+{aspects.length - tight.length}</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: c('#7FB8FF') }}>ดูมุมทั้งหมดและความหมาย</span>
          </a>
        </div>
        {/* ดาวที่ควรรู้จักก่อน + รูปแบบพิเศษ: รอข้อความหมวดใหม่จาก lib/gen2.py */}
      </div>
      {cat && !sheetPt && lib && (
        <CategorySheet cat={cat} chart={chart} aspects={aspects} dom={dom} lib={lib} known={known} ptHref={sheetHref} onClose={() => (location.hash = base)} />
      )}
      {sheetPt && chart.pos[sheetPt] && lib && (
        <PlanetSheet pt={sheetPt} chart={chart} aspects={aspects} lib={lib} known={known} personId={person.id} onClose={() => (location.hash = base)} />
      )}
      <TabBar active={navTab} />
    </Page>
  )
}
