// หน้า "เพิ่มคน" — ตาม design/AddPerson.dc.html
import { useEffect, useState } from 'preact/hooks'
import { PROVINCES, PROVINCE_TH } from '../engine/places.ts'
import { getMe, savePerson } from '../data/people.ts'
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

const num = (s: string, max: number) => (/^\d{1,2}$/.test(s) && +s <= max ? +s : null)

export function AddPerson() {
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
    getMe().then((m) => {
      // มี "ฉัน" ได้คนเดียว
      if (m) {
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
  const back = forMe ? '#/main' : '#/people'

  async function submit(e: Event) {
    e.preventDefault()
    if (!ok || !p) return
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
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: 600 }}>เพิ่มคน</h1>
          <span style={{ width: '80px' }} />
        </div>

        <form style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: '18px' }} onSubmit={submit}>
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
                {/* TODO: หมวดที่เพิ่มเอง — รอออกแบบตัวเลือกไอคอน/เมนูแก้ไข */}
                <button type="button" class="rt" style={{ borderStyle: 'dashed', color: '#7FB8FF', borderColor: 'rgba(127,184,255,.5)' }}>
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
                  <label>{lab('ชั่วโมง')}<input class={'in' + (hh && h === null ? ' bad' : '')} inputmode="numeric" maxLength={2} value={hh} onInput={(e) => setHh(e.currentTarget.value)} style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }} /></label>
                  <label>{lab('นาที')}<input class={'in' + (mi && m === null ? ' bad' : '')} inputmode="numeric" maxLength={2} value={mi} onInput={(e) => setMi(e.currentTarget.value)} style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums' }} /></label>
                </div>
                <span class="lbl">ระบบ 24 ชั่วโมง เช่น 20:33 = สองทุ่มสามสิบสามนาที</span>
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
              <div style={{ position: 'relative' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AA1B5" stroke-width="2" aria-hidden="true" style={{ position: 'absolute', left: '14px', top: '17px' }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input id="pv" class={'in' + (prov.trim() && !p ? ' bad' : '')} list="pv-list" autocomplete="off" value={prov} onInput={(e) => setProv(e.currentTarget.value)} style={{ paddingLeft: '42px' }} />
                <datalist id="pv-list">{[...BY_TH.keys()].sort((a, b) => a.localeCompare(b, 'th')).map((t) => <option value={t} />)}</datalist>
              </div>
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

          <button type="submit" aria-disabled={!ok} style={{ height: '56px', border: 'none', borderRadius: '16px', background: 'linear-gradient(135deg,#8A5CFF,#3B6BFF 55%,#1FA587)', color: '#FFFFFF', font: '600 17px var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: ok ? 1 : 0.45 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>บันทึกและดูชาร์ต
          </button>
          <span class="lbl" style={{ textAlign: 'center' }}>ข้อมูลเก็บในเครื่องนี้เท่านั้น</span>
        </form>
      </div>
    </Page>
  )
}
