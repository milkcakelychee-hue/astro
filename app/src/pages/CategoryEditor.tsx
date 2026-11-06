// แผ่น "หมวดใหม่ / แก้ไขหมวด" — ตาม new-screens/AddCategory.dc.html
import { useState } from 'preact/hooks'
import { CAT_COLORS, CAT_ICONS, deleteCat, saveCat, type RelCat } from '../data/people.ts'

const icon = (d: string, size = 20) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={d} /></svg>
export const catIcon = (c: RelCat, size = 18) => icon(CAT_ICONS[c.icon]![1], size)
const btn = { height: '52px', border: 'none', borderRadius: '16px', font: '600 16px var(--font)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }

export function CategoryEditor(props: { initial?: RelCat | null; cats: RelCat[]; counts: Record<string, number>; onClose: () => void; onSaved: (c: RelCat | null) => void }) {
  const i0 = props.initial ?? null
  const [edit, setEdit] = useState<RelCat | null>(i0)
  const [name, setName] = useState(i0?.name ?? '')
  const [ic, setIc] = useState(i0?.icon ?? 9)
  const [co, setCo] = useState(i0?.color ?? 1)
  const [askDel, setAskDel] = useState(false)
  const start = (c: RelCat | null) => { setEdit(c); setName(c?.name ?? ''); setIc(c?.icon ?? 9); setCo(c?.color ?? 1); setAskDel(false) }
  const ok = name.trim().length > 0
  const save = async () => {
    if (!ok) return
    const c: RelCat = edit ? { ...edit, name: name.trim(), icon: ic, color: co } : { id: crypto.randomUUID().slice(0, 8), name: name.trim(), icon: ic, color: co, createdAt: Date.now() }
    await saveCat(c)
    props.onSaved(c)
  }
  const col = CAT_COLORS[co]!
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div aria-hidden="true" onClick={props.onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(3,4,8,.55)' }} />
      <section role="dialog" aria-label="เพิ่มหมวดความสัมพันธ์" style={{ position: 'absolute', left: 0, right: 0, margin: '0 auto', maxWidth: '390px', top: '80px', bottom: 0, overflowY: 'auto', borderRadius: '28px 28px 0 0', background: 'linear-gradient(180deg,#151827 0%,#0C0E18 240px)', borderTop: '1px solid rgba(180,170,255,.30)', boxShadow: '0 -12px 40px rgba(0,0,0,.45)', color: '#F2F4FA', fontFamily: 'var(--font)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><span style={{ width: '40px', height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,.28)' }} /></div>
        <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}><span class="lbl">เพิ่มคน · ความสัมพันธ์</span><h1 style={{ margin: 0, fontSize: '21px', fontWeight: 600, lineHeight: 1.35 }}>{edit ? 'แก้ไขหมวด' : 'หมวดใหม่'}</h1></div>
            <button aria-label="ปิด" onClick={props.onClose} style={{ width: '44px', height: '44px', flex: 'none', borderRadius: '999px', border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#F2F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon('M6 6l12 12M18 6 6 18', 18)}</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '18px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
            <span style={{ flex: 'none', width: '64px', height: '72px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(255,255,255,.06)', border: `1px solid ${col}`, color: col, fontSize: '13px', fontWeight: 600, overflow: 'hidden' }}>{icon(CAT_ICONS[ic]![1])}<span style={{ maxWidth: '58px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name || 'ชื่อหมวด'}</span></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><span style={{ fontSize: '14px', fontWeight: 600 }}>ตัวอย่างป้าย</span><span class="lbl">จะแสดงแบบนี้ในหน้าเพิ่มคนและหน้าบุคคล</span></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><label for="cn" class="fl">ชื่อหมวด</label><input id="cn" class="in" value={name} maxLength={12} placeholder="เช่น ทีมฟุตบอล" onInput={(e) => setName(e.currentTarget.value)} /><span class="lbl">ไม่เกิน 12 ตัวอักษร เพื่อให้พอดีป้าย</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><span class="fl">ไอคอน</span>
            <div role="radiogroup" aria-label="ไอคอน" style={{ display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: '6px' }}>
              {CAT_ICONS.map(([n, d], i) => <button type="button" role="radio" aria-checked={i === ic} aria-label={n} onClick={() => setIc(i)} style={{ aspectRatio: '1', borderRadius: '12px', border: `1.5px solid ${i === ic ? col : 'rgba(255,255,255,.10)'}`, background: i === ic ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.03)', color: '#E6E9F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>{icon(d, 18)}</button>)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}><span class="fl">สี</span>
            <div role="radiogroup" aria-label="สี" style={{ display: 'flex', gap: '10px' }}>{CAT_COLORS.map((c, i) => <button type="button" role="radio" aria-checked={i === co} aria-label="สี" onClick={() => setCo(i)} style={{ width: '40px', height: '40px', borderRadius: '999px', border: `3px solid ${i === co ? '#F2F4FA' : 'transparent'}`, background: c, padding: 0 }} />)}</div>
          </div>
          <button type="button" onClick={save} aria-disabled={!ok} style={{ ...btn, background: 'linear-gradient(135deg,#8A5CFF,#3B6BFF 55%,#1FA587)', color: '#fff', marginTop: '4px', opacity: ok ? 1 : 0.5 }}>บันทึกหมวด</button>
          {edit && !askDel && <button type="button" onClick={() => setAskDel(true)} style={{ ...btn, background: 'rgba(255,107,107,.10)', border: '1px solid rgba(255,107,107,.40)', color: '#FF9A9A' }}>ลบหมวดนี้</button>}
          {edit && askDel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', borderRadius: '16px', background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.35)' }}>
              <span style={{ fontSize: '14px', lineHeight: 1.6 }}>ลบหมวด "{edit.name}" ใช่ไหม · คนในหมวดนี้ {props.counts[edit.id] ?? 0} คนจะย้ายไป "ไม่ระบุ" ข้อมูลเกิดไม่หาย</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}><button type="button" onClick={() => setAskDel(false)} style={{ ...btn, height: '44px', background: 'rgba(255,255,255,.08)', color: '#F2F4FA' }}>ยกเลิก</button><button type="button" onClick={async () => { await deleteCat(edit.id); props.onSaved(null) }} style={{ ...btn, height: '44px', background: '#FF6B6B', color: '#fff' }}>ลบ</button></div>
            </div>
          )}
          {props.cats.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px' }}><span class="fl">หมวดที่ตั้งเอง</span>
              <div style={{ overflow: 'hidden', borderRadius: '22px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)' }}>
                {props.cats.map((c, i) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '56px', padding: '10px 16px', boxSizing: 'border-box', borderTop: i ? '1px solid rgba(255,255,255,.07)' : undefined, fontSize: '15px' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: CAT_COLORS[c.color] + '29', color: CAT_COLORS[c.color], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{catIcon(c)}</span>
                    <span style={{ flex: 1 }}>{c.name}</span><span class="lbl">{props.counts[c.id] ?? 0} คน</span>
                    <button type="button" aria-label="แก้ไข" onClick={() => start(c)} style={{ border: 'none', background: 'transparent', color: '#7FB8FF', font: '500 14px var(--font)', padding: '8px' }}>แก้ไข</button>
                  </div>
                ))}
              </div>
              <span class="lbl" style={{ lineHeight: 1.6 }}>ลบหมวดได้ในหน้าแก้ไข คนที่อยู่ในหมวดนั้นจะย้ายไป "ไม่ระบุ" ข้อมูลเกิดไม่หาย</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
