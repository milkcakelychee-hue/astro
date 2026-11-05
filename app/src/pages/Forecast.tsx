// หน้า "ดูดวงล่วงหน้า" — ตาม design/Forecast.dc.html (ศูนย์รวมลิงก์ + การ์ดหมุดหมายใหญ่ที่กำลังมา)
// [dev] #/forecast?at=2026-11-01T00:00 = จำลองเวลาไทย
import { useEffect, useState } from 'preact/hooks'
import { computeChart, type Pt } from '../engine/chart.ts'
import { nextMajorEvent, type CycleEvent, type CycleKind } from '../engine/cycles.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { birthInput, getMe } from '../data/people.ts'
import { loadLib, splitTitle, text } from '../lib/interp.ts'
import { glyph } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './forecast.css'

const BG =
  'radial-gradient(520px 420px at 85% -40px,rgba(138,92,255,.45),transparent 70%),radial-gradient(460px 380px at -10% 300px,rgba(59,107,255,.32),transparent 70%),radial-gradient(500px 420px at 80% 1100px,rgba(31,165,135,.25),transparent 70%),radial-gradient(500px 420px at 10% 1800px,rgba(138,92,255,.18),transparent 70%),#06070D'

const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const PL: Partial<Record<Pt, [string, string, string]>> = {
  s: ['เสาร์', 'Saturn', '#8FD47A'], U: ['ยูเรนัส', 'Uranus', '#7FB8FF'], N: ['เนปจูน', 'Neptune', '#6FE0C0'], P: ['พลูโต', 'Pluto', '#FF8FB1'],
}
const KIND_TH: Record<CycleKind, string> = {
  return: 'โคจรกลับมาที่เดิม', sq1: 'ทำมุมฉากกับตำแหน่งเดิม (ฉากแรก)', opp: 'โคจรมาอยู่ตรงข้ามตำแหน่งเดิม', sq2: 'ทำมุมฉากกับตำแหน่งเดิม (ฉากหลัง)',
}
const KIND_EN: Record<CycleKind, string> = { return: 'Return', sq1: 'Square', opp: 'Opposition', sq2: 'Square' }

interface Hero { e: CycleEvent; body: string }
const arrow = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>

function Tile(p: { href: string; bg: string; fg: string; icon: preact.ComponentChildren; n: preact.ComponentChildren; t: string; d: string }) {
  return (
    <a href={p.href} class="t">
      <span class="ti" style={{ background: p.bg, color: p.fg }}>{p.icon}</span>
      <span class="tn">{p.n}</span><span class="tt">{p.t}</span><span class="td">{p.d}</span>
    </a>
  )
}
const ic = (d: preact.ComponentChildren, w = 1.7) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={w} aria-hidden="true">{d}</svg>

export function Forecast() {
  const [name, setName] = useState<string | null>(null)
  const [hero, setHero] = useState<Hero | null>(null)
  useEffect(() => {
    ;(async () => {
      const me = await getMe()
      if (!me) return
      setName(me.name)
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = at ? new Date(at + ':00+07:00') : new Date()
      const e = nextMajorEvent(swe, computeChart(swe, birthInput(me)), jdOfThai(swe, now))
      if (!e) return
      const s = text(lib, 'cycle', `${e.p}_${e.kind}`)
      setHero({ e, body: s ? splitTitle(s).body : '' })
    })().catch(() => {})
  }, [])

  let heroEl = null
  if (hero) {
    const { e } = hero
    const pl = PL[e.p]!
    const d = thaiParts(dateOfJd(e.jd))
    heroEl = (
      <a href="#/timeline" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px', borderRadius: '22px', textDecoration: 'none', color: '#F2F4FA', background: 'linear-gradient(135deg,rgba(138,92,255,.42),rgba(59,107,255,.28) 55%,rgba(31,165,135,.30))', border: '1px solid rgba(170,160,255,.40)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(6,7,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: pl[2] }}>{glyph(e.p)}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#D6CEFF' }}>เหตุการณ์สำคัญที่กำลังมา</span>
            <span style={{ fontSize: '17px', fontWeight: 600 }}>ดาว{pl[0]}{KIND_TH[e.kind]}</span>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#DCE0EA' }}>
          {e.nth === 1 ? 'ครั้งแรกในชีวิต' : `ครั้งที่ ${e.nth} ในชีวิต`} ตรงพอดีวันที่ {d.d} {MON[d.mo - 1]} {d.y + 543} {hero.body}
        </p>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#B5D6FF' }}>
          ดูในไทม์ไลน์ชีวิต <span class="lbl" style={{ color: '#C8D3FF' }}>({pl[1]} {KIND_EN[e.kind]})</span>{arrow}
        </span>
      </a>
    )
  }

  const intro: [string, string][] = [
    ['คืออะไร', 'ศูนย์รวมเครื่องมือดูดวงล่วงหน้าทุกแบบ'],
    ['ใช้ดู', 'เลือกหน้าที่ตรงกับคำถาม: วันนี้ เดือนนี้ ปีนี้ หรือหลายปี'],
    ['ทำไมสำคัญ', 'แต่ละวิธีตอบคนละช่วงเวลา ใช้ร่วมกันจะเห็นภาพครบ'],
  ]
  const which: [string, string][] = [
    ['วันนี้ / สัปดาห์นี้', 'ดาวตอนนี้กระทบชาร์ต · ปฏิทินดวงส่วนตัว'], ['ทุก 2 สัปดาห์', 'จันทร์ดับ จันทร์เต็ม'], ['เดือนนี้', 'ดวงรอบเดือน'], ['ปีนี้', 'ดวงรอบปี'], ['หลายปี', 'ไทม์ไลน์ชีวิต · ตัวตนเติบโต'],
  ]
  const sec = (h: string, l: string, kids: preact.ComponentChildren) => (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div class="sh"><h2 class="st">{h}</h2><span class="lbl">{l}</span></div>
      <div class="grid">{kids}</div>
    </section>
  )

  return (
    <Page background={BG}>
      <div class="pg-forecast" style={{ padding: '62px 20px 140px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <div class="sh" style={{ position: 'relative', paddingRight: '40px' }}>
          <span class="lbl">ชาร์ตของ {name ?? ''}</span>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>ดูดวงล่วงหน้า</h1>
          <details style={{ marginRight: '-40px' }}>
            <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 15px var(--font)", cursor: 'pointer' }}>?</summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
              {intro.map(([k, v]) => (
                <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>
              ))}
            </div>
          </details>
        </div>

        {heroEl}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px', borderRadius: '20px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.10)' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>อยากรู้อะไร ดูหน้าไหน</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: '8px 12px', fontSize: '13px', lineHeight: 1.5 }}>
            {which.map(([k, v]) => (<><span style={{ color: '#9AA1B5' }}>{k}</span><span>{v}</span></>))}
          </div>
          <span style={{ fontSize: '12px', lineHeight: 1.6, color: '#C9CEDC', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <b style={{ color: '#F2F4FA' }}>ดวงรอบเดือน กับ จันทร์ดับจันทร์เต็ม ต่างกันอย่างไร:</b> ดวงรอบเดือนนับรอบจาก<b>วันเกิดของคุณ</b> (ดวงจันทร์กลับที่เดิมของคุณ) ใช้ดูธีมอารมณ์ทั้งเดือน ส่วนจันทร์ดับจันทร์เต็มเป็น<b>เหตุการณ์บนฟ้าที่ทุกคนเจอวันเดียวกัน</b> แต่จะตกเรื่องต่างกันในชาร์ตแต่ละคน ใช้ดูว่าควรเริ่มหรือสรุปเรื่องไหน
          </span>
        </div>

        {sec('ช่วงนี้ดวงเป็นอย่างไร', 'ดาวที่โคจรอยู่ตอนนี้ไปกระทบชาร์ตคุณ', <>
          <Tile href="#/transit" bg="rgba(127,184,255,.16)" fg="#7FB8FF" icon={ic(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M20 4 14 10" /></>)} n="ดาวตอนนี้กระทบชาร์ตฉันอย่างไร" t="(Transit)" d="ตอนนี้ดาวบนฟ้ากำลังกระตุ้นเรื่องอะไรในชีวิตคุณ อะไรแรงสุด อะไรคลายแล้ว" />
          <Tile href="#/calendar" bg="rgba(185,166,255,.16)" fg="#B9A6FF" icon={ic(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4M12 14v4M10 16h4" /></>)} n={<>ปฏิทินดวงส่วนตัว<br />ดูทีละวัน ทีละเดือน</>} t="(Personal calendar)" d="ดูทีละวันว่าวันไหนเหมาะลงมือ วันไหนควรใจเย็น" />
          <Tile href="#/timeline" bg="rgba(111,224,192,.16)" fg="#6FE0C0" icon={ic(<><path d="M3 12h18" /><circle cx="6" cy="12" r="2" /><circle cx="13" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><path d="M6 8V5M13 8V5M19 8V5" /></>)} n="ไทม์ไลน์ชีวิต 1–5 ปีข้างหน้า" t="(Saturn Return ฯลฯ)" d="ภาพใหญ่ช่วงหลายปี เหตุการณ์สำคัญที่กินเวลาเป็นเดือน" />
          <Tile href="#/lunations" bg="rgba(243,212,110,.16)" fg="#F3D46E" icon={ic(<><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" /></>)} n="จันทร์ดับ จันทร์เต็ม ที่ตกในชาร์ตฉัน" t="(Lunations)" d="ทุก ~2 สัปดาห์ ดวงจันทร์ดับหรือเต็มจะไปตกเรื่องหนึ่งในชีวิตคุณ บอกว่าควรเริ่มหรือควรสรุปเรื่องไหน" />
        </>)}

        {sec('ดวงรายปี รายเดือน และพัฒนาการชีวิต', 'ชาร์ตที่สร้างใหม่ทุกรอบปี รอบเดือน และตามอายุ', <>
          <Tile href="#/solar-return" bg="rgba(255,122,89,.16)" fg="#FF9C80" icon={ic(<><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>)} n="ดวงรอบปีนับจากวันเกิด" t="(Solar Return)" d="ธีมของ 1 ปีนับจากวันเกิดถึงวันเกิดครั้งถัดไป" />
          <Tile href="#/lunar-return" bg="rgba(220,227,245,.14)" fg="#DCE3F5" icon={ic(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />)} n="ดวงรอบเดือน" t="(Lunar Return)" d="ธีมอารมณ์ของรอบ ~27 วัน นับจากวันที่ดวงจันทร์กลับมาที่เดิมของคุณ เหมือนดวงรอบปีแต่ย่อเป็นรายเดือน" />
          <a href="#/growth" class="t" style={{ gridColumn: 'span 2', minHeight: '0px', flexDirection: 'row', alignItems: 'center', gap: '14px' }}>
            <span class="ti" style={{ flex: 'none', background: 'rgba(143,212,122,.16)', color: '#8FD47A' }}>{ic(<><path d="M12 21V11" /><path d="M12 11C12 7 9 5 5 5c0 4 3 6 7 6zM12 14c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5z" /></>)}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span class="tn">ตัวตนฉันเติบโตไปทางไหน</span><span class="tt">(Secondary Progressions, Solar Arc, Primary Directions)</span><span class="td">ตัวตนข้างในค่อย ๆ โตไปทางไหนตามอายุ เปลี่ยนช้า ดูเป็นช่วงชีวิต</span></span>
          </a>
        </>)}

        {sec('ปฏิทินท้องฟ้า', 'ปรากฏการณ์ของดาวที่ทุกคนเห็นเหมือนกัน', <>
          <Tile href="#/retrograde" bg="rgba(255,138,76,.16)" fg="#FF8A4C" icon={ic(<><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v4h4" /></>)} n="ช่วงดาวถอยหลัง และช่วงเงาดาวพุธ" t="(Retrograde · Shadow)" d="ช่วงที่ดาวดูเหมือนเดินถอยหลัง เหมาะทบทวนมากกว่าเริ่มใหม่" />
          <Tile href="#/moon-phases" bg="rgba(220,227,245,.14)" fg="#DCE3F5" icon={ic(<><circle cx="6" cy="12" r="3" /><path d="M14 9a3 3 0 0 1 0 6z" fill="currentColor" /><circle cx="14" cy="12" r="3" /><circle cx="21" cy="12" r="1.5" /></>)} n="ปฏิทินดวงจันทร์ และช่วงจันทร์ว่าง" t="(Moon phases · VOC)" d="ข้างขึ้นข้างแรมทุกวัน และช่วงจันทร์ว่างที่ไม่ควรเริ่มเรื่องสำคัญ" />
          <Tile href="#/eclipses" bg="rgba(255,107,107,.16)" fg="#FF8A8A" icon={ic(<><circle cx="12" cy="12" r="8" /><circle cx="15" cy="10" r="7" fill="#06070D" stroke="none" /></>)} n="สุริยุปราคา / จันทรุปราคา" t="(Eclipses)" d="วันเกิดคราสและเรือนที่คราสตกในชาร์ตคุณ" />
          <Tile href="#/venus-rose" bg="rgba(255,143,177,.16)" fg="#FF8FB1" icon={ic(<><ellipse cx="12" cy="12" rx="9" ry="4" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(72 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(144 12 12)" /></>, 1.5)} n="รอบดาวศุกร์" t="(Venus Rose)" d="รอบ 8 ปีของดาวศุกร์ ดูจังหวะความรักและเงิน" />
          <Tile href="#/cycles" bg="rgba(127,184,255,.16)" fg="#7FB8FF" icon={ic(<><circle cx="12" cy="12" r="2" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="10" /><circle cx="18" cy="12" r="1.3" fill="currentColor" /></>, 1.6)} n="รอบโคจรของดาวเคราะห์" t="(Planetary cycles)" d="แต่ละรอบชีวิตอยู่ช่วงไหน หมุดหมายถัดไปเมื่อไร" />
          <Tile href="#/ephemeris" bg="rgba(201,206,220,.14)" fg="#C9CEDC" icon={ic(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 4v16" /></>)} n="ตารางตำแหน่งดาวรายวัน" t="(Ephemeris)" d="ตารางตำแหน่งดาวทุกวัน สำหรับคนที่อยากดูละเอียด" />
        </>)}

        {sec('หาคำตอบเฉพาะเรื่อง', 'ใช้เมื่อมีคำถามหรือเป้าหมายชัดเจน', <>
          <Tile href="#/electional" bg="rgba(79,209,165,.16)" fg="#4FD1A5" icon={ic(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="m9 15 2 2 4-4" /></>)} n="หาวันดีสำหรับเริ่มสิ่งใหม่" t="(Electional)" d="หาวันเวลาที่ดาวเป็นใจ ก่อนเริ่มงาน แต่งงาน หรือเปิดร้าน" />
          <a href="#/numerology" class="t">
            <span class="ti" style={{ flex: 'none', background: 'rgba(111,224,192,.16)', color: '#6FE0C0' }}>{ic(<path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16" />, 1.8)}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}><span class="tn">เลขศาสตร์</span><span class="tt">(ชื่อ · Life Path)</span><span class="td">ตัวเลขจากชื่อและวันเกิด</span></span>
          </a>
        </>)}
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
