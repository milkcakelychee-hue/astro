// หน้า "หาฤกษ์" — ตาม design/Electional.dc.html · เกณฑ์คะแนน docs/04 · ข้อความเหตุผลจากคลังหมวด electional
// [dev] #/electional?at=2026-11-04T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { electionalDays, type ElDay } from '../engine/electional.ts'
import { dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { loadLib, text, type InterpLib } from '../lib/interp.ts'
import { SIGN_TH } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
type G = 'start' | 'contract' | 'love' | 'move' | 'travel'
const GO: Record<G, [string, string, string, number[]]> = {
  start: ['M5 21V4h11l-2 4 2 4H5', 'เริ่มงาน เปิดตัว', 'เริ่มงานหรือเปิดตัว', [0, 4, 8, 9]],
  contract: ['M4 20h4L19 9l-4-4L4 16zM14 6l4 4', 'เซ็นสัญญา', 'เซ็นสัญญา', [1, 5, 9]],
  love: ['M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z', 'ความรัก นัดเดท', 'ความรัก', [1, 3, 6, 11]],
  move: ['M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5', 'ย้ายบ้าน ซื้อของใหญ่', 'ย้ายบ้านหรือซื้อของ', [1, 3, 9]],
  travel: ['M2 16l20-8-6 12-3-5zM13 15l3-7', 'เดินทาง', 'เดินทาง', [2, 8]],
}
const PN: Record<string, string> = { S: 'อาทิตย์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต' }
const TN: Record<string, string> = { '0': 'กุม', '6': 'ฉาก60', '4': 'ฉาก', '3': 'ตรีโกณ', '8': 'เล็ง' }
const GOOD = new Set(['3', '6', '0']), HARD = new Set(['4', '8'])
const WDN = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const p2 = (n: number) => (n < 10 ? '0' : '') + n
const pad = (h: number) => { const m = Math.floor(h * 60 + 1e-6); return `${p2(Math.floor(m / 60))}:${p2(m % 60)}` }
const hm = (m: number) => `${p2(Math.floor(m / 60))}:${p2(m % 60)}`
const OK = 'M5 12l5 5L20 7', NO = 'M6 6l12 12M18 6L6 18'

type Why = [1 | -1, string, string]
/** คะแนนตามเกณฑ์ใน docs/04 (ฐาน 50) */
function score(x: ElDay, g: G, lib: InterpLib) {
  const L = (k: string) => (text(lib, 'electional', k) ?? '').split(': ').slice(1).join(': ')
  let s = 50, best: number | null = null
  const why: Why[] = [], el = x.elong
  if (el < 12 || el > 348) { s -= 15; why.push([-1, 'ช่วงจันทร์ดับ', L('new')]) }
  else if (el < 180) { s += 12; why.push([1, 'ข้างขึ้น', L('waxing')]) }
  else { s -= 8; why.push([-1, 'ข้างแรม', L('waning')]) }
  for (const a of x.asp) {
    const p = a.p, t = TN[a.type]!
    if (GOOD.has(a.type) && (p === 'V' || p === 'J')) { s += 12; why.push([1, `จันทร์${t}${PN[p]} ${pad(a.h)} น.`, L('moon_benefic')]); best = a.h }
    else if (GOOD.has(a.type) && (p === 'S' || p === 'm')) { s += 5; why.push([1, `จันทร์${t}${PN[p]}`, L('moon_light')]); if (best === null) best = a.h }
    else if (HARD.has(a.type) && (p === 's' || p === 'a' || p === 'P' || p === 'U')) { s -= 12; why.push([-1, `จันทร์${t}${PN[p]} ${pad(a.h)} น.`, L('moon_hard')]) }
  }
  if (x.mercR && (g === 'contract' || g === 'travel' || g === 'start')) { s -= g === 'start' ? 10 : 28; why.push([-1, 'พุธถอยหลัง', L('mercury_rx')]) }
  if (x.venR && (g === 'love' || g === 'move')) { s -= 28; why.push([-1, 'ศุกร์ถอยหลัง', L('venus_rx')]) }
  if (GO[g][3].includes(x.sign)) { s += 8; why.push([1, `จันทร์ในราศี${SIGN_TH[x.sign]}`, L('moon_sign_fit')]) }
  const v = x.voc
  let win: string
  if (v && v[0] < 1200 && v[1] > 480) {
    s -= 6; why.push([-1, `จันทร์ว่าง ${hm(v[0])}–${hm(v[1])} น.`, L('voc')])
    win = v[0] > 720 ? `08:00–${hm(v[0])} น.` : v[1] < 1080 ? `${hm(v[1])}–20:00 น.` : 'ไม่มีช่วงที่ดี'
  } else win = best !== null ? `${pad(Math.max(8, best - 2))}–${pad(Math.min(20, best + 0.5))} น.` : '08:00–20:00 น.'
  return { s: Math.max(5, Math.min(98, s)), why, win }
}
const col = (s: number) => (s >= 70 ? ['rgba(124,224,167,.30)', '#9FEAC0', 'rgba(124,224,167,.10)'] : s >= 50 ? ['rgba(255,210,122,.20)', '#FFD27A', 'rgba(255,210,122,.10)'] : ['rgba(255,107,107,.18)', '#FF9A9A', 'rgba(255,107,107,.10)'])

export function Electional() {
  const [d, setD] = useState<{ days: ElDay[]; lib: InterpLib } | null>(null)
  const [g, setG] = useState<G>('start')
  const [sel, setSel] = useState(0)
  useEffect(() => {
    ;(async () => {
      const [swe, lib] = await Promise.all([getBrowserSwe(), loadLib()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const t = thaiParts(dateOfJd(jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())))
      setD({ days: electionalDays(swe, t.y, t.mo, t.d, 30), lib })
    })().catch(() => {})
  }, [])
  const R = d ? d.days.map((x, i) => ({ ...score(x, g, d.lib), x, i })) : []
  const wd = (x: ElDay) => new Date(Date.UTC(x.y, x.mo - 1, x.d)).getUTCDay()
  const first = R[0]?.x, last = R[R.length - 1]?.x
  const range = first && last ? `${first.d} ${MS[first.mo - 1]}${first.y !== last.y ? ' ' + (first.y + 543) : ''} – ${last.d} ${MS[last.mo - 1]} ${last.y + 543}` : ' '
  const mRange = first && last ? (first.mo === last.mo ? `${MS[first.mo - 1]} ${first.y + 543}` : `${MS[first.mo - 1]}${first.y !== last.y ? ' ' + (first.y + 543) : ''} – ${MS[last.mo - 1]} ${last.y + 543}`) : ''
  const top = R.slice().sort((a, b) => b.s - a.s).slice(0, 3)
  const S = R[sel]
  const intro: [string, string][] = [['คืออะไร', 'ตัวช่วยหาวันและช่วงเวลาที่ดาวเป็นใจ สำหรับเรื่องที่คุณจะเริ่ม'], ['ใช้ดู', 'เลือกเรื่องที่จะทำ แล้วดูวันที่คะแนนดีที่สุดใน 30 วันข้างหน้า พร้อมเหตุผล'], ['ทำไมสำคัญ', 'โหราศาสตร์เชื่อว่าจังหวะเริ่มต้นส่งผลต่อเรื่องนั้นต่อไป เลือกวันดีช่วยเพิ่มโอกาสให้ราบรื่น']]
  const ic = (p: string, w = 12, sw = 3) => <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={sw} stroke-linecap="round" aria-hidden="true"><path d={p} /></svg>
  const chip = { height: '22px', padding: '0 8px', borderRadius: '7px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 600, whiteSpace: 'nowrap' }

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{range}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>หาฤกษ์</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Electional astrology)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>จะทำเรื่องอะไร</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: '6px' }}>
              {(Object.keys(GO) as G[]).map((k) => { const on = k === g; return <button onClick={() => setG(k)} aria-pressed={on} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 2px', borderRadius: '14px', border: `1px solid ${on ? '#B9A6FF' : 'rgba(255,255,255,.10)'}`, background: on ? 'rgba(185,166,255,.20)' : 'rgba(255,255,255,.03)', color: '#F2F4FA', font: '500 11px var(--font)', lineHeight: 1.3, textAlign: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={GO[k][0]} /></svg>{GO[k][1].split(' ').map((w) => <span style={{ display: 'block', whiteSpace: 'nowrap' }}>{w}</span>)}</button> })}
            </div>
          </div>

          {d && S && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>3 วันที่ดีที่สุด · {GO[g][2]}</span>
                {top.map((r) => {
                  const c = col(r.s)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', borderRadius: '20px', background: c[2], border: `1px solid ${c[1]}66` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ flex: 'none', width: '46px', height: '46px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,7,13,.45)', lineHeight: 1.1 }}><b style={{ fontSize: '17px' }}>{r.x.d}</b><span style={{ fontSize: '10px', color: '#C9CEDC' }}>{MS[r.x.mo - 1]}</span></span>
                        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.4 }}><span style={{ fontSize: '14.5px', fontWeight: 600 }}>วัน{WDN[wd(r.x)]} · {r.s >= 70 ? 'ดีมาก' : r.s >= 50 ? 'พอใช้' : 'ควรเลี่ยง'}</span><span class="lbl">ช่วงเวลาแนะนำ {r.win}</span></span>
                        <span style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}><span style={{ fontSize: '20px', fontWeight: 700, color: c[1] }}>{r.s}</span><span style={{ fontSize: '10.5px', color: '#C9CEDC' }}>คะแนน/100</span></span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{r.why.slice(0, 4).map((w) => <span style={{ ...chip, background: w[0] > 0 ? 'rgba(124,224,167,.14)' : 'rgba(255,107,107,.14)', color: w[0] > 0 ? '#9FEAC0' : '#FF9A9A' }}>{ic(w[0] > 0 ? OK : NO)}{w[1]}</span>)}</div>
                    </div>
                  )
                })}
              </div>

              <div class="card" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>คะแนนทุกวัน · {mRange}</span><span class="lbl">แตะวันเพื่อดูเหตุผล</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '4px', fontSize: '11px', color: '#9AA1B5', textAlign: 'center' }}>{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((w) => <span>{w}</span>)}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '4px' }}>
                  {Array.from({ length: wd(R[0]!.x) }, () => <span />)}
                  {R.map((r, i) => <button onClick={() => setSel(i)} aria-pressed={i === sel} style={{ height: '52px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', borderRadius: '12px', border: `1.5px solid ${i === sel ? '#F2F4FA' : 'transparent'}`, background: col(r.s)[0], color: '#F2F4FA', font: '600 13px var(--font)' }}><span>{r.x.d}<span style={{ fontSize: '9px', fontWeight: 500, color: '#C9CEDC' }}>{r.x.d === 1 && i > 0 ? ' ' + MS[r.x.mo - 1] : ''}</span></span><span style={{ fontSize: '10px', fontWeight: 500, color: '#E6E9F2', opacity: 0.85 }}>{r.s}</span></button>)}
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '11.5px', color: '#C9CEDC', padding: '0 4px' }}>
                  {([['rgba(124,224,167,.45)', 'ดีมาก 70+'], ['rgba(255,210,122,.35)', 'พอใช้ 50–69'], ['rgba(255,107,107,.30)', 'ควรเลี่ยง ต่ำกว่า 50']] as const).map(([b, l]) => <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><i style={{ width: '12px', height: '12px', borderRadius: '3px', background: b }} />{l}</span>)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: '14px', fontWeight: 600 }}>วัน{WDN[wd(S.x)]}ที่ {S.x.d} {MS[S.x.mo - 1]}</span><span style={{ fontSize: '16px', fontWeight: 700, color: col(S.s)[1] }}>{S.s} คะแนน</span></div>
                  <span class="lbl">ดวงจันทร์ในราศี{SIGN_TH[S.x.sign]} · {S.x.elong < 12 || S.x.elong > 348 ? 'จันทร์ดับ' : S.x.elong < 180 ? 'ข้างขึ้น' : 'ข้างแรม'} · ช่วงเวลาแนะนำ {S.win}</span>
                  {S.why.map((w) => <span style={{ fontSize: '13px', lineHeight: 1.55, color: '#DCE0EA' }}><b style={{ color: w[0] > 0 ? '#9FEAC0' : '#FF9A9A', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{ic(w[0] > 0 ? OK : NO)}{w[1]}</b> · {w[2]}</span>)}
                </div>
              </div>
            </>
          )}
          <span class="lbl">คะแนนคิดจากตำแหน่งดาวช่วง 08:00–20:00 น.: ข้างขึ้นข้างแรม · มุมที่ดวงจันทร์ทำกับดาว · ดาวพุธ/ศุกร์ถอยหลัง · ราศีของดวงจันทร์ที่เข้ากับเรื่องนั้น · ช่วงจันทร์ว่าง · ยังไม่รวมเรือนในชาร์ตคุณและลัคนาของเวลาเริ่ม · เกณฑ์ตั้งขึ้นเอง</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
