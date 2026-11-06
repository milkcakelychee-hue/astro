// หน้า "วงโคจรดาวศุกร์" — ตาม design/VenusRose.dc.html
// [dev] #/venus-rose?at=2026-11-04T12:00 = จำลองวันนี้
import { useEffect, useState } from 'preact/hooks'
import { computeChart } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { bodyAt, dateOfJd, jdOfThai, thaiParts } from '../engine/sky.ts'
import { maxElong, venusConj, venusElong, venusPath, type VConj } from '../engine/venus.ts'
import { birthInput, getMe } from '../data/people.ts'
import { loadLib, splitTitle, text, type InterpLib } from '../lib/interp.ts'
import { SIGN_GLYPH, SIGN_TH } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const tp = (jd: number) => thaiParts(dateOfJd(jd))
const fd = (jd: number) => { const p = tp(jd); return `${p.d} ${MS[p.mo - 1]} ${p.y + 543}` }
const fds = (jd: number) => { const p = tp(jd); return `${p.d} ${MS[p.mo - 1]} ${String(p.y + 543).slice(2)}` }
const sgD = (lon: number) => `${SIGN_TH[Math.floor(lon / 30)]} ${Math.floor(lon % 30)}°`
const sgDM = (lon: number) => { const m = Math.floor((lon % 30) * 60); return `${SIGN_TH[Math.floor(lon / 30)]} ${Math.floor(m / 60)}°${String(m % 60).padStart(2, '0')}′` }
/** พิกัดในรูป: เมษอยู่ขวา ทวนเข็มนาฬิกา */
const xy = (lon: number, r: number) => [150 + r * Math.cos((lon * Math.PI) / 180), 150 - r * Math.sin((lon * Math.PI) / 180)] as const
const K = 68

interface Natal { lon: number; morning: boolean; retro: boolean; near: VConj; days: number }
interface Data {
  now: number; lib: InterpLib; conj: VConj[]; path: { lon: number; dist: number }[]
  v: { lon: number; dist: number; el: number; retro: boolean; dUntil: number | null }; start: VConj; next: VConj; maxE: { jd: number; deg: number }
  natal: Natal | null
}

export function VenusRose() {
  const [d, setD] = useState<Data | null>(null)
  useEffect(() => {
    ;(async () => {
      const [swe, lib, me] = await Promise.all([getBrowserSwe(), loadLib(), getMe()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = jdOfThai(swe, at ? new Date(at + ':00+07:00') : new Date())
      const all = venusConj(swe, now - 600, now + 8 * 365.25 + 600)
      const start = [...all].reverse().find((c) => c.inferior && c.jd <= now)!
      const next = all.find((c) => c.inferior && c.jd > now)!
      const conj = all.filter((c) => c.jd >= start.jd).slice(0, 10)
      const end = conj[conj.length - 1]!.jd + 30
      const r = swe.calc_ut(now, 3, 2 | 256)
      const vb = bodyAt(swe, now, 'V')
      let dUntil: number | null = null
      if (vb.speed < 0) { let x = now; while (bodyAt(swe, x, 'V').speed < 0) x += 1; let lo = x - 1, hi = x; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (bodyAt(swe, m, 'V').speed < 0) lo = m; else hi = m } dUntil = hi }
      const el = venusElong(swe, now)
      // ช่วงดาวรุ่ง/ประจำเมืองปัจจุบัน: หาจุดห่างสุดก่อนกุมครั้งถัดไป
      const nextAny = all.find((c) => c.jd > now)!
      const maxE = maxElong(swe, now, nextAny.jd)
      let natal: Natal | null = null
      if (me) {
        const nc = computeChart(swe, birthInput(me))
        const bc = venusConj(swe, nc.jd - 300, nc.jd + 300)
        const near = bc.reduce((a, b) => (Math.abs(b.jd - nc.jd) < Math.abs(a.jd - nc.jd) ? b : a))
        natal = { lon: nc.pos.V.lon, morning: venusElong(swe, nc.jd) < 0, retro: nc.pos.V.speed < 0, near, days: Math.round(near.jd - nc.jd) }
      }
      setD({ now, lib, conj, path: venusPath(swe, start.jd, end), v: { lon: vb.lon, dist: r[2]!, el, retro: vb.speed < 0, dUntil }, start, next, maxE, natal })
    })().catch(() => {})
  }, [])

  const body = (k: string) => { const s = d ? text(d.lib, 'cycle', k) : null; return s ? splitTitle(s).body : '' }
  const morning = d ? d.v.el < 0 : false
  const pc = d ? Math.round(((d.now - d.start.jd) / (d.next.jd - d.start.jd)) * 100) : 0
  const infs = d ? d.conj.filter((c) => c.inferior).slice(0, 5) : []
  const sups = d ? d.conj.filter((c) => !c.inferior) : []
  const nowP = d ? tp(d.now) : null
  const yr0 = d ? tp(d.start.jd).y + 543 : 0
  const intro: [string, string][] = [['คืออะไร', 'เส้นทางดาวศุกร์มองจากโลก ครบรอบทุก 8 ปี กุมดวงอาทิตย์ด้านใน 5 ครั้ง วาดเป็นรูปดาว 5 แฉก (Venus Rose)'], ['ใช้ดู', 'ดูว่าตอนนี้ดาวศุกร์อยู่ช่วงไหนของรอบ และรอบใหม่ของเรื่องความรัก คุณค่า และความสุขจะเริ่มเมื่อไร'], ['ทำไมสำคัญ', 'ทุกครั้งที่ดาวศุกร์กุมดวงอาทิตย์ด้านใน คือการเริ่มรอบใหม่ของเรื่องความสัมพันธ์และสิ่งที่เราให้คุณค่า']]

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{d ? `รอบ 8 ปี · ${yr0} – ${yr0 + 8}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>วงโคจรดาวศุกร์</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Venus Rose · Venus cycle)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          {d && nowP && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(60,40,70,.95),rgba(255,158,199,.22) 60%,rgba(138,92,255,.22))', border: '1px solid rgba(255,190,220,.30)' }}>
              <span style={{ fontSize: '12px', color: '#FFD3E6' }}>ดาวศุกร์ตอนนี้ · {nowP.d} {MS[nowP.mo - 1]} {nowP.y + 543}</span>
              <span style={{ fontSize: '21px', fontWeight: 600 }}>{morning ? 'ดาวรุ่ง' : 'ดาวประจำเมือง'} <span style={{ fontSize: '14px', fontWeight: 400, color: '#FFD3E6' }}>({morning ? 'Morning star' : 'Evening star'})</span></span>
              <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#E6E9F2' }}>{morning ? 'ขึ้นทางทิศตะวันออกก่อนรุ่งสาง' : 'อยู่ทางทิศตะวันตกหลังพลบค่ำ'} ห่างดวงอาทิตย์ {Math.round(Math.abs(d.v.el))}° · ราศี{sgDM(d.v.lon)}{d.v.dUntil ? ` · ยังเดินถอยหลังถึง ${tp(d.v.dUntil).d} ${MS[tp(d.v.dUntil).mo - 1]}` : ''}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,.10)' }}><span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pc}%`, borderRadius: '4px', background: '#FF9EC7' }} /><span style={{ position: 'absolute', left: `${pc}%`, top: '-3px', width: '14px', height: '14px', marginLeft: '-7px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #FF9EC7' }} /></div>
                <div class="lbl" style={{ display: 'flex', justifyContent: 'space-between' }}><span>เริ่มรอบ {fds(d.start.jd)}</span><span>รอบถัดไป {fds(d.next.jd)}</span></div>
              </div>
              <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{body(morning ? 'venus_morning' : 'venus_evening')} · ดาวศุกร์จะห่างดวงอาทิตย์มากที่สุด {Math.round(d.maxE.deg)}° ในวันที่ {fd(d.maxE.jd)}</span>
            </div>
          )}

          {d && (
            <div class="card" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, padding: '0 4px' }}>เส้นทาง 8 ปีมองจากโลก</span>
              <svg viewBox="0 0 300 300" width="100%" style={{ display: 'block', maxWidth: '330px', margin: '0 auto' }} aria-label="เส้นทางดาวศุกร์ 8 ปีมองจากโลก">
                <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,.12)" />
                <circle cx="150" cy="150" r="128" fill="none" stroke="rgba(255,255,255,.06)" />
                {Array.from({ length: 12 }, (_, k) => { const [x1, y1] = xy(k * 30, 128), [x2, y2] = xy(k * 30, 140), [tx, ty] = xy(k * 30 + 15, 134); return <><line x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke="rgba(255,255,255,.14)" /><text x={tx.toFixed(1)} y={(ty + 3).toFixed(1)} text-anchor="middle" font-size="8" fill="#9AA1B5">{SIGN_GLYPH[k]}</text></> })}
                <path d={d.path.map((p, i) => { const [x, y] = xy(p.lon, p.dist * K); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join(' ')} fill="none" stroke="#FF9EC7" stroke-width=".8" opacity=".75" />
                <path d={[...infs, infs[0]!].map((c, i) => { const [x, y] = xy(c.lon, 128); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join(' ')} fill="none" stroke="#FFD27A" stroke-width="1" stroke-dasharray="3 3" opacity=".8" />
                {infs.map((c) => { const [x, y] = xy(c.lon, 128); return <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="4" fill="#FFD27A" /> })}
                {d.natal && (() => { const [x, y] = xy(d.natal.lon, 128); return <><line x1="150" y1="150" x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="#7FE0A7" stroke-width="1.2" stroke-dasharray="2 3" /><circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="4.5" fill="#7FE0A7" /></> })()}
                {(() => { const [x, y] = xy(d.v.lon, d.v.dist * K); return <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="4.5" fill="#FF9EC7" stroke="#fff" stroke-width="1.2" /> })()}
                <circle cx="150" cy="150" r="5" fill="#5BA7FF" />
              </svg>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '11.5px', color: '#C9CEDC', padding: '0 4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#5BA7FF' }} />โลก (จุดกลาง)</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FF9EC7', border: '1px solid #fff' }} />ดาวศุกร์วันนี้</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#FFD27A' }} />จุดเริ่มรอบ 5 จุด</span>
                {d.natal && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><i style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#7FE0A7' }} />ดาวศุกร์กำเนิดคุณ</span>}
              </div>
              <span class="lbl" style={{ padding: '0 4px', lineHeight: 1.6 }}>วงในคือช่วงที่ดาวศุกร์อยู่ใกล้โลกและเดินถอยหลัง เส้นประเชื่อมจุดเริ่มรอบทั้ง 5 ใน 8 ปีจะเป็นรูปดาว 5 แฉก</span>
            </div>
          )}

          {d?.natal && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderColor: 'rgba(127,224,167,.35)' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>ดาวศุกร์กำเนิดของคุณ</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#9FEAC0' }}>{d.natal.morning ? 'ดาวรุ่ง (Morning star)' : 'ดาวประจำเมือง (Evening star)'}{d.natal.retro ? ' · เดินถอยหลัง' : ''}</span>
              <span class="lbl">ราศี{sgDM(d.natal.lon)} · เกิด{d.natal.days >= 0 ? 'ก่อน' : 'หลัง'}ดาวศุกร์กุมดวงอาทิตย์{d.natal.near.inferior ? 'ด้านใน' : 'ด้านนอก'} {Math.abs(d.natal.days)} วัน ({fd(d.natal.near.jd)})</span>
              <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{body(d.natal.morning ? 'venus_morning' : 'venus_evening')}</span>
            </div>
          )}

          {d && (
            <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>จุดสำคัญในรอบ 8 ปี</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', lineHeight: 1.5, color: '#C9CEDC' }}>
                <span style={{ display: 'flex', gap: '8px' }}><i style={{ flex: 'none', marginTop: '4px', width: '9px', height: '9px', borderRadius: '50%', background: '#FFD27A' }} /><span><b style={{ color: '#F2F4FA' }}>เริ่มรอบใหม่</b> · {body('venus_inferior').replace(/^จุดเริ่มรอบใหม่ \d+ วัน /, '')}</span></span>
                <span style={{ display: 'flex', gap: '8px' }}><i style={{ flex: 'none', marginTop: '4px', width: '9px', height: '9px', borderRadius: '50%', border: '2px solid #8A90A3', boxSizing: 'border-box' }} /><span><b style={{ color: '#F2F4FA' }}>กึ่งรอบ</b> · {body('venus_superior').replace(/^จุดกึ่งรอบ /, '')}</span></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr)', gap: '0 8px', fontSize: '11px', color: '#9AA1B5', paddingTop: '4px' }}><span /><span>เริ่มรอบใหม่</span><span>กึ่งรอบ</span></div>
              {infs.map((c, k) => {
                const s = sups.find((x) => x.jd > c.jd)
                const cur = k === 0
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr) minmax(0,1fr)', gap: '8px', alignItems: 'center', minHeight: '46px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
                    <span style={{ fontSize: '12px', color: '#9AA1B5', textAlign: 'center' }}>{k + 1}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, padding: '6px 8px', borderRadius: '10px', background: cur ? 'rgba(255,158,199,.14)' : 'rgba(255,210,122,.08)', border: `1px solid ${cur ? 'rgba(255,158,199,.45)' : 'rgba(255,210,122,.25)'}` }}><span style={{ fontSize: '13px', fontWeight: 600 }}>{fd(c.jd)}</span><span style={{ fontSize: '11px', color: '#C9CEDC' }}>{sgD(c.lon)}{cur ? ' · เพิ่งผ่าน' : ''}</span></span>
                    {s && <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35, padding: '6px 8px' }}><span style={{ fontSize: '13px', fontWeight: 500 }}>{fd(s.jd)}</span><span style={{ fontSize: '11px', color: '#9AA1B5' }}>{sgD(s.lon)}</span></span>}
                  </div>
                )
              })}
            </div>
          )}
          <span class="lbl">คำนวณด้วย Swiss Ephemeris แบบมองจากโลก (Geocentric) เวลาไทย</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
