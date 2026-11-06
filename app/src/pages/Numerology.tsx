// หน้า "เลขศาสตร์" — ตาม design/Numerology.dc.html · ข้อความจากคลังหมวด numerology
// ผู้ใช้ตัดส่วน "เลขจากชื่อ" ออก (6 พ.ย. 2569) · [dev] #/numerology?at=2026-11-04T12:00
import { useEffect, useState } from 'preact/hooks'
import { getMe, type Person } from '../data/people.ts'
import { lifePath, personalMonth, personalYear, reduce } from '../engine/numerology.ts'
import { loadLib, text, type InterpLib } from '../lib/interp.ts'
import { thaiDate } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './solarreturn.css'

const BG = 'radial-gradient(520px 420px at 85% -40px,rgba(220,227,245,.24),transparent 70%),radial-gradient(460px 380px at -10% 380px,rgba(59,107,255,.28),transparent 70%),radial-gradient(500px 420px at 90% 1300px,rgba(138,92,255,.22),transparent 70%),#06070D'
const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
/** ป้ายสั้นของปี/เดือนส่วนตัว (ข้อความ UI ตามดีไซน์) */
const KW = ['', 'เริ่มต้น', 'ร่วมมือ', 'สร้างสรรค์', 'วางรากฐาน', 'เปลี่ยนแปลง', 'ครอบครัว', 'ทบทวน', 'ผลลัพธ์', 'ปิดรอบ']
/** "เลขชีวิต 5 "นักสำรวจ": รักอิสระ…" → [ชื่อ, คำอธิบาย] */
const life = (lib: InterpLib, n: number): [string, string] => { const t = text(lib, 'numerology', 'life' + n) ?? ''; return [/"(.*?)"/.exec(t)?.[1] ?? '', t.split(': ').slice(1).join(': ')] }
const after = (lib: InterpLib, k: string) => (text(lib, 'numerology', k) ?? '').split(': ').slice(1).join(': ')
/** ขั้นตอนลดเลข: "1+9+9+9 = 28 → 2+8 = 10 → 1" */
const chain = (n: number) => { const r = reduce(n); if (!r.steps.length) return ''; return ' → ' + r.steps.map((s) => (/^\d\+0 = /.test(s) ? s.split(' = ')[1] : s)).join(' → ') }

export function Numerology() {
  const [d, setD] = useState<{ me: Person | null; lib: InterpLib; y: number; mo: number } | null>(null)
  const [sel, setSel] = useState(-1)
  useEffect(() => {
    ;(async () => {
      const [lib, me] = await Promise.all([loadLib(), getMe()])
      const at = new URLSearchParams(location.hash.split('?')[1] ?? '').get('at')
      const now = new Date(Date.now() + 7 * 3600000), t = at ? new Date(at + ':00Z') : now
      setD({ me, lib, y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1 })
    })().catch(() => {})
  }, [])
  const intro: [string, string][] = [['คืออะไร', 'ศาสตร์ตัวเลขที่ลดวันเกิดให้เหลือเลขหลักเดียว แต่ละเลขมีความหมายของตัวเอง'], ['ใช้ดู', 'ดูแก่นนิสัยจากวันเกิด (Life Path) และธีมของปีนี้ เดือนนี้ (ปีส่วนตัว)'], ['ทำไมสำคัญ', 'เป็นมุมมองเสริมที่คำนวณง่าย ใช้คู่กับชาร์ตดาวเพื่อดูจังหวะชีวิตเป็นรอบ 9 ปี']]
  const me = d?.me
  const L = me ? lifePath(me.y, me.mo, me.d) : null
  const py = me && d ? personalYear(me.d, me.mo, d.y) : 0
  const cur = py - 1, s = sel < 0 ? cur : sel
  const yrs = d ? Array.from({ length: 9 }, (_, i) => d.y - cur + i) : []

  return (
    <Page background={BG}>
      <div class="pg-sr">
        <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
          <a href="#/forecast" style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ดูดวงล่วงหน้า</a>
        </div>
        <div style={{ padding: '4px 20px 140px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">{me ? `${me.name} · ${thaiDate(me.y, me.mo, me.d)}` : ' '}</span>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 600, lineHeight: 1.3 }}>เลขศาสตร์</h1>
            <span style={{ fontSize: '13px', color: '#9AA1B5' }}>(Numerology)</span>
            <details style={{ marginRight: '-40px' }}>
              <summary aria-label="หน้านี้คืออะไร" style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 15px var(--font)', cursor: 'pointer' }}>?</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: 1.6 }}>
                {intro.map(([k, v]) => <div style={{ display: 'flex', gap: '10px' }}><span style={{ flex: 'none', width: '78px', color: '#9AA1B5' }}>{k}</span><span style={{ flex: 1, minWidth: 0, color: '#E6E9F2' }}>{v}</span></div>)}
              </div>
            </details>
          </div>

          {d && me && L && (() => {
            const [ln, ld] = life(d.lib, L.n), bd = reduce(me.d).n, [bn, bdd] = life(d.lib, bd)
            const pm = personalMonth(py, d.mo), ny = personalYear(me.d, me.mo, d.y + 1)
            const core = [
              { t: 'เลขวันเกิด', n: bd, k: bn, ds: bdd, col: '#B5D6FF' },
              { t: `ปีส่วนตัว ${d.y + 543}`, n: py, k: KW[py]!, ds: after(d.lib, 'year' + py), col: '#FFD27A' },
              { t: `เดือนส่วนตัว ${MS[d.mo - 1]}`, n: pm, k: KW[pm]!, ds: after(d.lib, 'month' + pm).replace(/^ธีมเดือนนี้ — /, ''), col: '#9FEAC0' },
              { t: `ปีหน้า ${d.y + 544}`, n: ny, k: KW[ny]!, ds: after(d.lib, 'year' + ny), col: '#FF9EC7' },
            ]
            const sy = yrs[s]!, sp = s + 1
            return (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '18px', borderRadius: '24px', background: 'linear-gradient(140deg,rgba(40,50,70,.95),rgba(91,167,255,.22) 60%,rgba(138,92,255,.25))', border: '1px solid rgba(180,200,255,.30)' }}>
                  <span style={{ fontSize: '12px', color: '#D6DEFF' }}>เลขชีวิต (Life Path)</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span style={{ flex: 'none', width: '76px', height: '76px', borderRadius: '22px', background: 'rgba(6,7,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', fontWeight: 700, color: '#B5D6FF' }}>{L.n}</span><span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}><span style={{ fontSize: '19px', fontWeight: 600 }}>{ln}</span><span style={{ fontSize: '13px', lineHeight: 1.55, color: '#E6E9F2' }}>{ld}</span></span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(6,7,13,.35)', fontSize: '12.5px', lineHeight: 1.6, color: '#C9CEDC' }}>
                    <span>วิธีคิด: วัน {me.d}{chain(me.d)} · เดือน {me.mo}{chain(me.mo)} · ปี {me.y}{chain(me.y)}</span>
                    <span>{L.d.n} + {L.mo.n} + {L.y.n} = {L.sum}{L.steps.length ? ' → ' + L.steps.map((x) => x.split(' = ')[0]).join(' → ') + ' = ' : ' = '}<b style={{ color: '#B5D6FF' }}>{L.n}</b></span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {core.map((c) => <div class="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}><span class="lbl">{c.t}</span><span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}><b style={{ fontSize: '28px', color: c.col }}>{c.n}</b><span style={{ fontSize: '13px', fontWeight: 600 }}>{c.k}</span></span><span style={{ fontSize: '12px', lineHeight: 1.5, color: '#C9CEDC' }}>{c.ds}</span></div>)}
                </div>

                <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '15px', fontWeight: 600 }}>รอบ 9 ปีของคุณ</span><span class="lbl">ปีส่วนตัววนจาก 1 ถึง 9 แล้วเริ่มใหม่ · แตะปีเพื่ออ่าน</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9,minmax(0,1fr))', gap: '4px' }}>
                    {yrs.map((y, i) => <button onClick={() => setSel(i)} aria-pressed={i === s} style={{ height: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: 0, borderRadius: '10px', border: `1.5px solid ${i === s ? '#F2F4FA' : 'transparent'}`, background: i === cur ? 'rgba(91,167,255,.35)' : i < cur ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.08)', color: '#F2F4FA', font: '700 16px var(--font)' }}><span>{i + 1}</span><span style={{ fontSize: '9px', fontWeight: 500, color: '#C9CEDC' }}>{String(y + 543).slice(2)}</span></button>)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,.04)' }}><span style={{ fontSize: '14px', fontWeight: 600 }}>ปี {sy + 543} · ปีส่วนตัว {sp} {KW[sp]}{s === cur ? ' (ปีนี้)' : ''}</span><span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>{after(d.lib, 'year' + sp)}</span></div>
                </div>
              </>
            )
          })()}
          {d && !me && <span style={{ fontSize: '14px', color: '#C9CEDC' }}>เพิ่มข้อมูลวันเกิดของคุณก่อน แล้วกลับมาดูเลขศาสตร์ได้ที่นี่</span>}
          <span class="lbl">เลขชีวิตและปีส่วนตัวคิดแบบพีทาโกรัส (Pythagorean)</span>
        </div>
      </div>
      <TabBar active="forecast" />
    </Page>
  )
}
