// หน้า "เพิ่มคน" — ตาม design/AddPerson.dc.html
import { useEffect, useState } from 'preact/hooks'
import { PROVINCES, PROVINCE_TH } from '../engine/places.ts'
import { computeChart } from '../engine/chart.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { SIGN_TH } from '../ui/astro-labels.ts'
import { CAT_COLORS, birthInput, listCats, listPeople, timeKnown, deletePerson, getMe, getPerson, savePerson, type Person, type RelCat } from '../data/people.ts'
import { CategoryEditor, catIcon } from './CategoryEditor.tsx'
import { Page } from '../ui/components.tsx'
import './addperson.css'

const BG = 'radial-gradient(520px 420px at 90% -40px,rgba(138,92,255,.42),transparent 70%),radial-gradient(460px 380px at -10% 300px,rgba(31,165,135,.30),transparent 70%),#06070D'
const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']
// ephemeris รองรับ ค.ศ. 1995 เป็นต้นไป (ดีไซน์: "ตั้งแต่ พ.ศ. 2538")
const Y0 = 1995
const BY_TH = new Map(PROVINCES.map((p) => [PROVINCE_TH[p.name]!, p]))

const ic = (d: preact.ComponentChildren) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">{d}</svg>
const RELS: { key: string; label: string; icon: preact.ComponentChildren }[] = [
  { key: 'me', label: 'ฉัน', icon: ic(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>) },
  { key: 'family', label: 'ครอบครัว', icon: ic(<><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /><path d="M12 18s-3-1.8-3-3.6a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 1.8-3 3.6-3 3.6z" /></>) },
  { key: 'friend', label: 'เพื่อน', icon: ic(<><circle cx="8" cy="8" r="3" /><circle cx="16" cy="8" r="3" /><path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0" /></>) },
  { key: 'lover', label: 'คนรัก', icon: ic(<path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z" />) },
  { key: 'work', label: 'ที่ทำงาน', icon: ic(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>) },
]

const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const thaiD = (t: number) => { const x = new Date(t); return `${x.getDate()} ${MS[x.getMonth()]} ${x.getFullYear() + 543}` }
const num = (s: string, max: number) => (/^\d{1,2}$/.test(s) && +s <= max ? +s : null)

// แก้ไขข้อมูลคน (new-screens/EditPerson.dc.html): #/add?edit=<id> ใช้ฟอร์มเดียวกัน
export function AddPerson() {
  const editId = new URLSearchParams(location.hash.split('?')[1] ?? '').get('edit')
  const [orig, setOrig] = useState<Person | null>(null)
  const [note, setNote] = useState('')
  const [askDel, setAskDel] = useState(false)
  const [sum, setSum] = useState('')
  const [cats, setCats] = useState<RelCat[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [catOpen, setCatOpen] = useState(false)
  const [catInit, setCatInit] = useState<RelCat | null>(null)
  // กดค้างที่หมวดที่ตั้งเอง → แก้ไข/ลบ
  let pressT = 0
  const pressStart = (c: RelCat) => { pressT = window.setTimeout(() => { setCatInit(c); setCatOpen(true) }, 550) }
  const pressEnd = () => clearTimeout(pressT)
  const loadCats = async () => {
    setCats(await listCats())
    const n: Record<string, number> = {}
    for (const x of await listPeople()) if (x.relation.startsWith('c:')) n[x.relation.slice(2)] = (n[x.relation.slice(2)] ?? 0) + 1
    setCounts(n)
  }
  const forMe = location.hash.includes('me=1')
  const [hasMe, setHasMe] = useState(false)
  const [name, setName] = useState('')
  const [rel, setRel] = useState(forMe ? 'me' : 'friend')
  const [d, setD] = useState(0)
  const [mo, setMo] = useState(0)
  const [y, setY] = useState(0)
  const [unknown, setUnknown] = useState(false)
  const [hh, setHh] = useState('')
  const [mi, setMi] = useState('')
  const [prov, setProv] = useState('')

  useEffect(() => {
    loadCats()
    if (editId) getPerson(editId).then((x) => {
      if (!x) return
      setOrig(x); setName(x.name); setRel(x.relation); setD(x.d); setMo(x.mo); setY(x.y)
      setUnknown(x.hh === null); setHh(x.hh === null ? '' : String(x.hh).padStart(2, '0')); setMi(x.mi === null ? '' : String(x.mi).padStart(2, '0'))
      setProv(PROVINCE_TH[x.province] ?? ''); setNote(x.note ?? '')
      getBrowserSwe().then((swe) => {
        const c = computeChart(swe, birthInput(x))
        const sg = (p: 'S' | 'M' | 'A') => SIGN_TH[Math.floor(c.pos[p].lon / 30)]
        setSum(`☉ ${sg('S')} · ☽ ${sg('M')}${timeKnown(x) ? ` · AC ${sg('A')}` : ''}`)
      })
    })
    getMe().then((m) => {
      // มี "ฉัน" ได้คนเดียว
      if (m && m.id !== editId) {
        setHasMe(true)
        setRel((r) => (r === 'me' ? 'friend' : r))
      }
    })
  }, [])

  const now = new Date()
  const years: number[] = []
  for (let i = now.getFullYear(); i >= Y0; i--) years.push(i)
  const days = y && mo ? new Date(y, mo, 0).getDate() : 31
  const p = BY_TH.get(prov.trim())
  const h = num(hh, 23)
  const m = num(mi, 59)
  const ok = name.trim() !== '' && d > 0 && d <= days && mo > 0 && y > 0 && !!p && (unknown || (h !== null && m !== null))
  const viewHref = (x: { id: string; isMe: boolean }) => (x.isMe ? '#/main' : '#/people?id=' + x.id)
  const back = orig ? viewHref(orig) : forMe ? '#/main' : '#/people'

  async function submit(e: Event) {
    e.preventDefault()
    if (!ok || !p) return
    if (orig) {
      const np = { ...orig, name: name.trim(), y, mo, d, hh: unknown ? null : h, mi: unknown ? null : m, province: p.name, relation: rel, isMe: rel === 'me', note: note.trim() || undefined, updatedAt: Date.now() }
      await savePerson(np)
      location.hash = viewHref(np)
      return
    }
    await savePerson({
      id: crypto.randomUUID(),
      name: name.trim(),
      y, mo, d,
      hh: unknown ? null : h,
      mi: unknown ? null : m,
      province: p.name,
      relation: rel,
      isMe: rel === 'me',
      createdAt: Date.now(),
    })
    location.hash = rel === 'me' ? '#/main' : '#/people'
  }

  const lab = (t: string) => <span class="lbl" style={{ display: 'block', marginBottom: '4px' }}>{t}</span>
  return (
    <Page background={BG}>
      <div class="pg-add">
        <div style={{ position: 'sticky', top: 0, padding: '54px 12px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg,rgba(6,7,13,.95),rgba(6,7,13,.6))', zIndex: 2 }}>
          <a href={back} style={{ height: '44px', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>ยกเลิก
          </a>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>{orig ? 'แก้ไขข้อมูล' : 'เพิ่มคน'}</h1>
          {orig ? <button type="submit" form="pf" aria-disabled={!ok} style={{ height: '44px', padding: '0 12px', border: 'none', background: 'transparent', color: ok ? '#7FB8FF' : '#5A6075', font: '600 15px var(--font)' }}>บันทึก</button> : <span style={{ width: '80px' }} />}
        </div>

        <form id="pf" style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: '18px' }} onSubmit={submit}>
          {orig && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '20px', background: 'linear-gradient(135deg,rgba(138,92,255,.30),rgba(59,107,255,.20))', border: '1px solid rgba(180,170,255,.35)' }}>
              <span style={{ width: '52px', height: '52px', borderRadius: '999px', background: 'rgba(6,7,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600 }}>{orig.name.slice(0, 1)}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '17px', fontWeight: 600 }}>{orig.name}</span><span style={{ fontSize: '12.5px', color: '#D6DEFF' }}>{sum}</span></span>
            </div>
          )}
          <div class="group">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label for="nm" class="fl">ชื่อ</label>
              <input id="nm" class="in" placeholder="ชื่อเล่น หรือชื่อจริง" value={name} onInput={(e) => setName(e.currentTarget.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span class="fl" id="rel">ความสัมพันธ์</span>
              <div role="radiogroup" aria-labelledby="rel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '8px' }}>
                {RELS.map((r) => (
                  <button type="button" role="radio" aria-checked={rel === r.key} class={rel === r.key ? 'rt on' : 'rt'} disabled={r.key === 'me' && hasMe} onClick={() => setRel(r.key)}>
                    {r.icon}{r.label}
                  </button>
                ))}
                {cats.map((c) => {
                  const k = 'c:' + c.id
                  return <button type="button" role="radio" aria-checked={rel === k} class={rel === k ? 'rt on' : 'rt'} onClick={() => setRel(k)} onPointerDown={() => pressStart(c)} onPointerUp={pressEnd} onPointerLeave={pressEnd} onContextMenu={(e) => e.preventDefault()} style={rel === k ? undefined : { color: CAT_COLORS[c.color] }}>{catIcon(c)}{c.name}</button>
                })}
                <button type="button" class="rt" onClick={() => { setCatInit(null); setCatOpen(true) }} style={{ borderStyle: 'dashed', color: '#7FB8FF', borderColor: 'rgba(127,184,255,.5)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>เพิ่มหมวด
                </button>
              </div>
              <span class="lbl">หมวดที่เพิ่มเองเลือกไอคอนได้ · กดค้างที่หมวดเพื่อแก้ไขหรือลบ</span>
            </div>
          </div>

          <div class="group">
            <span class="fl">วันเกิด</span>
            <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0,1fr) 96px', gap: '8px' }}>
              <label>{lab('วัน')}<select class="in sel" value={d} onChange={(e) => setD(+e.currentTarget.value)}>
                <option value={0}>–</option>
                {Array.from({ length: days }, (_, i) => <option value={i + 1}>{i + 1}</option>)}
              </select></label>
              <label>{lab('เดือน')}<select class="in sel" value={mo} onChange={(e) => setMo(+e.currentTarget.value)}>
                <option value={0}>–</option>
                {MONTHS.map((t, i) => <option value={i + 1}>{t}</option>)}
              </select></label>
              <label>{lab('ปี พ.ศ.')}<select class="in sel" value={y} onChange={(e) => setY(+e.currentTarget.value)}>
                <option value={0}>–</option>
                {years.map((v) => <option value={v}>{v + 543}</option>)}
              </select></label>
            </div>
            <span class="lbl">รองรับปีเกิดตั้งแต่ พ.ศ. 2538 เป็นต้นไป</span>
          </div>

          <div class="group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span class="fl">เวลาเกิด</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#C9CEDC', minHeight: '44px' }}>
                ไม่ทราบเวลาเกิด
                <button type="button" role="switch" aria-checked={unknown} aria-label="ไม่ทราบเวลาเกิด" onClick={() => setUnknown(!unknown)} style={{ width: '52px', height: '32px', borderRadius: '999px', border: 'none', padding: '3px', background: unknown ? '#4FD1A5' : 'rgba(255,255,255,.18)', display: 'flex', justifyContent: unknown ? 'flex-end' : 'flex-start' }}>
                  <span style={{ width: '26px', height: '26px', borderRadius: '999px', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
                </button>
              </label>
            </div>
            {!unknown ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px' }}>
                  <label>{lab('ชั่วโมง')}{/* ผู้ใช้ขอ: เลื่อนเลือก (iPhone แสดงเป็นวงล้อ) แทนการพิมพ์ */}<select class="in sel" value={hh} onChange={(e) => setHh(e.currentTarget.value)} style={{ textAlign: 'center', textAlignLast: 'center', fontVariantNumeric: 'tabular-nums' }}><option value="" disabled>–</option>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((x) => <option value={x}>{x}</option>)}</select></label>
                  <label>{lab('นาที')}<select class="in sel" value={mi} onChange={(e) => setMi(e.currentTarget.value)} style={{ textAlign: 'center', textAlignLast: 'center', fontVariantNumeric: 'tabular-nums' }}><option value="" disabled>–</option>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((x) => <option value={x}>{x}</option>)}</select></label>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', padding: '12px', borderRadius: '14px', background: 'rgba(243,212,110,.08)', border: '1px solid rgba(243,212,110,.30)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3D46E" stroke-width="1.8" aria-hidden="true" style={{ flex: 'none', marginTop: '2px' }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
                <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}>ลัคนาและเรือนเปลี่ยนทุก ๆ ไม่กี่นาที จึงจะซ่อนไว้ ดาวอื่นจะคำนวณจากเวลา 12:00 น. ส่วนดวงจันทร์อาจคลาดได้ราว ±6°</span>
              </div>
            )}
          </div>

          <div class="group">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label for="pv" class="fl">จังหวัดที่เกิด</label>
              {/* ผู้ใช้ขอ: dropdown (iPhone ไม่รองรับ datalist) */}
              <select id="pv" class="in sel" value={p ? prov : ''} onChange={(e) => setProv(e.currentTarget.value)}>
                <option value="" disabled>เลือกจังหวัด</option>
                {[...BY_TH.keys()].sort((a, b) => a.localeCompare(b, 'th')).map((t) => <option value={t}>{t}</option>)}
              </select>
              <span class="lbl">เลือกได้เฉพาะ 77 จังหวัดในประเทศไทย</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '8px' }}>
              <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span class="lbl">พิกัด</span>
                <span style={{ fontSize: '15px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p ? `${p.latDeg}°${p.latMin}′N ${p.lonDeg}°${p.lonMin}′E` : '–'}</span>
              </div>
              <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(6,7,13,.45)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span class="lbl">เขตเวลา</span>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>UTC+7 เวลาไทย</span>
              </div>
            </div>
          </div>

          {orig && (
            <>
              <div style={{ display: 'flex', gap: '10px', padding: '12px 14px', borderRadius: '14px', background: 'rgba(243,212,110,.08)', border: '1px solid rgba(243,212,110,.30)', fontSize: '13px', lineHeight: 1.6, color: '#DCE0EA' }}><span style={{ flex: 'none', color: '#F3D46E' }}>!</span><span>ถ้าแก้วัน เวลา หรือจังหวัด ชาร์ตและคำอธิบายทั้งหมดของคนนี้จะคำนวณใหม่ โน้ตที่จดไว้ยังอยู่</span></div>
              <div class="group"><label for="nt" class="fl">โน้ต</label><textarea id="nt" rows={2} value={note} onInput={(e) => setNote(e.currentTarget.value)} style={{ boxSizing: 'border-box', width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#F2F4FA', font: '15px/1.6 var(--font)', resize: 'none' }} /></div>
              <button type="button" onClick={() => setAskDel(true)} style={{ height: '52px', borderRadius: '16px', font: '600 16px var(--font)', width: '100%', background: 'rgba(255,107,107,.10)', border: '1px solid rgba(255,107,107,.40)', color: '#FF9A9A' }}>ลบคนนี้</button>
              {orig.updatedAt && <span class="lbl" style={{ textAlign: 'center' }}>แก้ไขล่าสุด {thaiD(orig.updatedAt)}</span>}
            </>
          )}
          {!orig && <button type="submit" aria-disabled={!ok} style={{ height: '56px', border: 'none', borderRadius: '16px', background: 'linear-gradient(135deg,#8A5CFF,#3B6BFF 55%,#1FA587)', color: '#FFFFFF', font: '600 17px var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: ok ? 1 : 0.45 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>บันทึกและดูชาร์ต
          </button>}
          {!orig && <span class="lbl" style={{ textAlign: 'center' }}>ข้อมูลเก็บในเครื่องนี้เท่านั้น</span>}
        </form>
        {catOpen && <CategoryEditor initial={catInit} cats={cats} counts={counts} onClose={() => setCatOpen(false)} onSaved={async (c) => { await loadCats(); if (c) setRel('c:' + c.id); else if (rel.startsWith('c:')) setRel('none'); setCatOpen(false) }} />}
        {orig && askDel && (
          <>
            <div onClick={() => setAskDel(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(3,4,8,.70)', zIndex: 5 }} />
            <div role="alertdialog" aria-label="ยืนยันการลบ" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'calc(min(390px,100vw) - 48px)', boxSizing: 'border-box', zIndex: 6, padding: '22px 20px 18px', borderRadius: '24px', background: '#151827', border: '1px solid rgba(255,107,107,.35)', boxShadow: '0 20px 50px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
              <span style={{ alignSelf: 'center', width: '52px', height: '52px', borderRadius: '999px', background: 'rgba(255,107,107,.14)', color: '#FF9A9A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg></span>
              <span style={{ fontSize: '18px', fontWeight: 600 }}>ลบ "{orig.name}" ใช่ไหม</span>
              <span style={{ fontSize: '13.5px', lineHeight: 1.6, color: '#C9CEDC' }}>ข้อมูลเกิด ชาร์ต โน้ต และการเปรียบเทียบดวงกับคนนี้จะหายถาวร กู้คืนไม่ได้ ยกเว้นจากไฟล์สำรอง</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setAskDel(false)} style={{ height: '48px', border: 'none', borderRadius: '16px', font: '600 16px var(--font)', background: 'rgba(255,255,255,.08)', color: '#F2F4FA' }}>ยกเลิก</button>
                <button type="button" onClick={async () => { await deletePerson(orig.id); location.hash = orig.isMe ? '#/main' : '#/people' }} style={{ height: '48px', border: 'none', borderRadius: '16px', font: '600 16px var(--font)', background: '#FF6B6B', color: '#fff' }}>ลบ</button>
              </div>
            </div>
          </>
        )}
      </div>
    </Page>
  )
}
