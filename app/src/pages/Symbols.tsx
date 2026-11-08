// หน้า "ความหมายสัญลักษณ์" — ตาม design/Symbols.dc.html
// ป้ายสั้น (ชื่อ, คำสำคัญ) ตามดีไซน์ · คำอธิบายบรรทัดล่างดึงจากคลัง (ดีไซน์ระบุ "รอดึงจากคลังคำอธิบาย")
import { useEffect, useState } from 'preact/hooks'
import { loadLib, text, type InterpLib } from '../lib/interp.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const V = '︎'
type T = 'p' | 's' | 'a' | 'h'
/** [สัญลักษณ์, ชื่อ, อังกฤษ, สี, คำสำคัญ, คีย์คลัง] */
type Item = [string, string, string, string, string, string]
const D: Record<T, [string, Item[]]> = {
  p: ['ดาวคือ "ใคร" หรือ "พลังอะไร" ในชีวิต', [['☉', 'ดวงอาทิตย์', 'Sun', '#FFC46B', 'ตัวตน · พลังชีวิต', 'S'], ['☽', 'ดวงจันทร์', 'Moon', '#DCE3F5', 'อารมณ์ · ความรู้สึก', 'M'], ['☿', 'ดาวพุธ', 'Mercury', '#B5D6FF', 'ความคิด · การสื่อสาร', 'm'], ['♀', 'ดาวศุกร์', 'Venus', '#FF8FB1', 'ความรัก · คุณค่า', 'V'], ['♂', 'ดาวอังคาร', 'Mars', '#FF7A59', 'แรงขับ · การลงมือ', 'a'], ['♃', 'ดาวพฤหัสบดี', 'Jupiter', '#FFC46B', 'โอกาส · การขยาย', 'J'], ['♄', 'ดาวเสาร์', 'Saturn', '#D6B87A', 'ความรับผิดชอบ · บทเรียน', 's'], ['♅', 'ดาวยูเรนัส', 'Uranus', '#5BD1FF', 'อิสรภาพ · ความเปลี่ยนแปลง', 'U'], ['♆', 'ดาวเนปจูน', 'Neptune', '#7FB8FF', 'ความฝัน · จินตนาการ', 'N'], ['♇', 'ดาวพลูโต', 'Pluto', '#C98BFF', 'อำนาจ · การเปลี่ยนแปลงลึก', 'P'], ['☊', 'จุดโหนดเหนือ', 'North Node', '#B9A6FF', 'ทิศทางที่ควรเติบโต', 'n'], ['⚷', 'ไครอน', 'Chiron', '#7FE0A7', 'บาดแผล · การเยียวยา', 'c'], ['⚸', 'ลิลิธ', 'Black Moon Lilith', '#C9CEDC', 'ด้านที่ถูกเก็บซ่อน', 'L']]],
  s: ['ราศีคือ "แบบไหน" ที่พลังของดาวแสดงออก', [['♈', 'เมษ', 'Aries', '#FF7A59', 'ไฟ · 21 มี.ค.–19 เม.ย.', '0'], ['♉', 'พฤษภ', 'Taurus', '#9FEAC0', 'ดิน · 20 เม.ย.–20 พ.ค.', '1'], ['♊', 'เมถุน', 'Gemini', '#B5D6FF', 'ลม · 21 พ.ค.–20 มิ.ย.', '2'], ['♋', 'กรกฎ', 'Cancer', '#7FB8FF', 'น้ำ · 21 มิ.ย.–22 ก.ค.', '3'], ['♌', 'สิงห์', 'Leo', '#FF7A59', 'ไฟ · 23 ก.ค.–22 ส.ค.', '4'], ['♍', 'กันย์', 'Virgo', '#9FEAC0', 'ดิน · 23 ส.ค.–22 ก.ย.', '5'], ['♎', 'ตุลย์', 'Libra', '#B5D6FF', 'ลม · 23 ก.ย.–22 ต.ค.', '6'], ['♏', 'พิจิก', 'Scorpio', '#7FB8FF', 'น้ำ · 23 ต.ค.–21 พ.ย.', '7'], ['♐', 'ธนู', 'Sagittarius', '#FF7A59', 'ไฟ · 22 พ.ย.–21 ธ.ค.', '8'], ['♑', 'มังกร', 'Capricorn', '#9FEAC0', 'ดิน · 22 ธ.ค.–19 ม.ค.', '9'], ['♒', 'กุมภ์', 'Aquarius', '#B5D6FF', 'ลม · 20 ม.ค.–18 ก.พ.', '10'], ['♓', 'มีน', 'Pisces', '#7FB8FF', 'น้ำ · 19 ก.พ.–20 มี.ค.', '11']]],
  a: ['มุมคือ "ความสัมพันธ์" ระหว่างดาวสองดวง', [['☌', 'กุม', 'Conjunction 0°', '#FFD27A', 'รวมพลัง', 'c'], ['⚹', 'โยค', 'Sextile 60°', '#9FEAC0', 'โอกาส', 'x'], ['□', 'ฉาก', 'Square 90°', '#FF9A9A', 'แรงเสียดทาน', 'q'], ['△', 'ตรีโกณ', 'Trine 120°', '#9FEAC0', 'ไหลลื่น', 't'], ['☍', 'เล็ง', 'Opposition 180°', '#FF9A9A', 'ดึงกันสองฝั่ง', 'o']]],
  h: ['เรือนคือ "เรื่องไหน" ของชีวิตที่พลังไปลง', [['1', 'เรือน 1', 'Ascendant', '#F2F4FA', 'ตัวตน', '1'], ['2', 'เรือน 2', '', '#F2F4FA', 'เงินและคุณค่า', '2'], ['3', 'เรือน 3', '', '#F2F4FA', 'การสื่อสาร', '3'], ['4', 'เรือน 4', 'IC', '#F2F4FA', 'บ้านและรากฐาน', '4'], ['5', 'เรือน 5', '', '#F2F4FA', 'ความรักและความสนุก', '5'], ['6', 'เรือน 6', '', '#F2F4FA', 'งานประจำและสุขภาพ', '6'], ['7', 'เรือน 7', 'Descendant', '#F2F4FA', 'คู่ครองและหุ้นส่วน', '7'], ['8', 'เรือน 8', '', '#F2F4FA', 'สิ่งที่แบ่งปัน', '8'], ['9', 'เรือน 9', '', '#F2F4FA', 'โลกกว้าง', '9'], ['10', 'เรือน 10', '', '#F2F4FA', 'อาชีพและชื่อเสียง', '10'], ['11', 'เรือน 11', '', '#F2F4FA', 'เพื่อนและเครือข่าย', '11'], ['12', 'เรือน 12', '', '#F2F4FA', 'โลกภายใน', '12']]],
}

/** คำอธิบายจากคลัง: ดาว = "พลังเรื่อง…" (planet_house) · ราศี = "แสดงออกแบบ…" (planet_sign) · มุม = ส่วนหลัง "—" (aspect) · เรือน = "ไปลงที่เรื่อง…" (planet_house) */
function desc(lib: InterpLib, t: T, k: string): string {
  const s = (c: Parameters<typeof text>[1], key: string) => text(lib, c, key) ?? ''
  if (t === 'p') return /พลังเรื่อง(.*?) ไปลงที่เรื่อง/.exec(s('planet_house', k + '1'))?.[1] ?? ''
  if (t === 'h') return /ไปลงที่เรื่อง(.*?) — /.exec(s('planet_house', 'S' + k))?.[1] ?? ''
  if (t === 's') return /แสดงออกแบบ(.*?) จุดเด่น/.exec(s('planet_sign', 'S' + k))?.[1] ?? ''
  return / — (.*?) ด้านดี/.exec(s('aspect', 'S' + k + 'M'))?.[1] ?? ''
}

export function Symbols() {
  const [lib, setLib] = useState<InterpLib | null>(null)
  const [t, setT] = useState<T>('p')
  useEffect(() => { loadLib().then(setLib).catch(() => {}) }, [])
  const intro: [string, string][] = [['คืออะไร', 'รวมสัญลักษณ์ทุกตัวที่ใช้ในแอป: ดาว ราศี มุมดาว และเรือน'], ['ใช้ดู', 'เมื่อเห็นสัญลักษณ์ในหน้าไหนแล้วไม่แน่ใจว่าคืออะไร'], ['ทำไมสำคัญ', 'อ่านชาร์ตได้เร็วขึ้น ไม่ต้องจำเองทั้งหมด']]
  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/settings" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ตั้งค่า</a>
        </div>
        <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">คู่มือ</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>ความหมายสัญลักษณ์</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Symbols)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>
          <div role="tablist" style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px', background: 'rgba(255,255,255,.07)' }}>
            {([['p', 'ดาว'], ['s', 'ราศี'], ['a', 'มุม'], ['h', 'เรือน']] as const).map(([k, l]) => <button role="tab" aria-selected={t === k} class={t === k ? 'seg on' : 'seg'} onClick={() => setT(k)}>{l}</button>)}
          </div>
          <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#C9CEDC' }}>{D[t][0]}</span>
          <div class="card" style={{ padding: '4px 16px' }}>
            {D[t][1].map((x, i) => (
              <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: '12px', alignItems: 'center', padding: '12px 0', borderTop: i ? '1px solid rgba(255,255,255,.06)' : 'none' }}>
                <span style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: x[3] }}>{t === 'h' ? x[0] : x[0] + V}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', lineHeight: 1.45, minWidth: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{x[1]} {x[2] && <span style={{ fontWeight: 400, color: '#9AA1B5', fontSize: '12.5px' }}>({x[2]})</span>}</span>
                  <span class="lbl">{x[4]}</span>
                  {lib && <span style={{ fontSize: '13px', color: '#DCE0EA' }}>{desc(lib, t, x[5])}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TabBar active="settings" />
    </Page>
  )
}
