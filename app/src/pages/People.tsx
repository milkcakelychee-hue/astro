// หน้า "บุคคล" — ตาม design/People.dc.html (รายชื่อ + ค้นหา + โหมดเลือก 2 คนเพื่อเปรียบเทียบ)
import { useEffect, useState } from 'preact/hooks'
import { computeChart } from '../engine/chart.ts'
import { signOf } from '../engine/dominants.ts'
import { getBrowserSwe } from '../engine/ephe-browser.ts'
import { PROVINCE_TH } from '../engine/places.ts'
import { REL_AVATAR, REL_LABEL, birthInput, listPeople, timeKnown, type Person } from '../data/people.ts'
import { SIGN_TH, hhmm, thaiDate } from '../ui/astro-labels.ts'
import { Page } from '../ui/components.tsx'
import { TabBar } from '../ui/TabBar.tsx'
import './people.css'

const BG =
  'radial-gradient(520px 420px at 90% -40px,rgba(31,165,135,.40),transparent 70%),radial-gradient(460px 380px at -10% 260px,rgba(138,92,255,.35),transparent 70%),radial-gradient(500px 420px at 70% 900px,rgba(59,107,255,.25),transparent 70%),#06070D'

const rel = (p: Person) => (p.isMe ? 'me' : p.relation)
/** อักษรแรกของชื่อ (ข้ามสระหน้า เ แ โ ใ ไ) */
const initial = (n: string) => Array.from(n.trim().replace(/^[เแโใไ]/, ''))[0] ?? ''

interface Row {
  p: Person
  sun: string
  moon: string
  ac: string
  b: string
}

export function People() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    ;(async () => {
      const [people, swe] = await Promise.all([listPeople(), getBrowserSwe()])
      // ฉัน อยู่บนสุด แล้วตามลำดับที่เพิ่ม
      people.sort((a, b) => Number(b.isMe) - Number(a.isMe) || a.createdAt - b.createdAt)
      setRows(
        people.map((p) => {
          const known = timeKnown(p)
          const ch = computeChart(swe, birthInput(p))
          return {
            p,
            sun: SIGN_TH[signOf(ch.pos.S.lon)]!,
            moon: SIGN_TH[signOf(ch.pos.M.lon)]!,
            ac: known ? SIGN_TH[signOf(ch.pos.A.lon)]! : '—',
            b: `${thaiDate(p.y, p.mo, p.d)} · ${known ? hhmm(p.hh!, p.mi!) : 'ไม่ทราบเวลาเกิด'} · ${PROVINCE_TH[p.province] ?? p.province}`,
          }
        }),
      )
    })().catch((e: unknown) => setErr(String(e)))
  }, [])

  const [q, setQ] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [sel, setSel] = useState<string[]>([])

  if (err) return <Page background={BG}><div style={{ padding: '62px 20px', color: '#FF9A9A' }}>{err}</div><TabBar active="people" /></Page>
  const all = rows ?? []
  const qq = q.trim()
  const shown = qq ? all.filter((r) => [r.p.name, r.sun, r.moon, r.ac].some((x) => x.includes(qq))) : all
  const byId = new Map(all.map((r) => [r.p.id, r]))
  const ready = sel.length === 2

  const pick = (id: string) => {
    if (!selecting) {
      location.hash = '#/main?id=' + id
      return
    }
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)))
  }

  return (
    <Page background={BG}>
      <div class="pg-people" style={{ padding: '62px 20px 230px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span class="lbl">ชาร์ตที่บันทึกไว้ · {all.length} คน</span>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>บุคคล</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="#/add" aria-label="เพิ่มคน" style={{ width: '44px', height: '44px', borderRadius: '999px', background: 'linear-gradient(135deg,#8A5CFF,#3B6BFF)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </a>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '48px', padding: '0 14px', borderRadius: '14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.10)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AA1B5" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>ค้นหาชื่อ</span>
          <input type="search" placeholder="ค้นหาชื่อ หรือราศี" value={q} onInput={(e) => setQ(e.currentTarget.value)} style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: '#F2F4FA', font: '15px var(--font)', outline: 'none' }} />
        </label>

        <button
          onClick={() => {
            setSelecting(!selecting)
            setSel([])
          }}
          aria-pressed={selecting}
          style={{
            display: 'flex', alignItems: 'center', gap: '14px', width: '100%', padding: '14px 16px', borderRadius: '20px', color: '#F2F4FA', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
            border: `1px solid ${selecting ? 'rgba(127,184,255,.45)' : 'rgba(170,160,255,.40)'}`,
            background: selecting ? 'rgba(127,184,255,.12)' : 'linear-gradient(135deg,rgba(138,92,255,.35),rgba(59,107,255,.25) 55%,rgba(31,165,135,.28))',
          }}
        >
          <span aria-hidden="true" style={{ width: '52px', height: '52px', flex: 'none', borderRadius: '16px', background: 'rgba(6,7,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none"><circle cx="13" cy="18" r="9" stroke="#B9A6FF" stroke-width="2" /><circle cx="23" cy="18" r="9" stroke="#6FE0C0" stroke-width="2" /><path d="M18 10.6a9 9 0 0 1 0 14.8a9 9 0 0 1 0-14.8z" fill="#8FA8FF" fill-opacity=".55" /><path d="M13 4.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#F3D46E" /><path d="M25 27.5l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z" fill="#F3D46E" /></svg>
          </span>
          <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>{selecting ? `เลือกแล้ว ${sel.length}/2 คน` : 'เปรียบเทียบความเข้ากัน'}</span>
            <span style={{ fontSize: '13px', color: '#C9CEDC', lineHeight: 1.5 }}>{selecting ? 'แตะชื่อด้านล่าง · แตะตรงนี้อีกครั้งเพื่อยกเลิก' : 'เลือก 2 คน ดูว่าดาวของทั้งคู่ส่งเสริมหรือท้าทายกัน'}</span>
          </span>
          <span aria-hidden="true" style={{ width: '32px', height: '32px', flex: 'none', borderRadius: '999px', background: 'rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{selecting ? '✕' : '›'}</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shown.map((r) => {
            const on = sel.includes(r.p.id)
            return (
              <button class="person" onClick={() => pick(r.p.id)} aria-pressed={selecting ? on : undefined} style={on && selecting ? { borderColor: '#7FB8FF', background: 'rgba(127,184,255,.10)' } : undefined}>
                {selecting && (
                  <span style={{ width: '24px', height: '24px', flex: 'none', borderRadius: '999px', boxSizing: 'border-box', border: `2px solid ${on ? '#7FB8FF' : 'rgba(255,255,255,.35)'}`, background: on ? '#7FB8FF' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06070D' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                )}
                <span style={{ width: '48px', height: '48px', flex: 'none', borderRadius: '999px', background: REL_AVATAR[rel(r.p)] ?? REL_AVATAR.friend, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                  {initial(r.p.name)}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.p.name}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,255,255,.10)', color: '#C9CEDC', whiteSpace: 'nowrap' }}>ความสัมพันธ์: {REL_LABEL[rel(r.p)] ?? r.p.relation}</span>
                  </span>
                  <span style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#C9CEDC' }}>
                    <span>☉︎ {r.sun}</span><span>☽︎ {r.moon}</span><span>AC {r.ac}</span>
                  </span>
                  <span class="lbl">{r.b}</span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA1B5" stroke-width="2" aria-hidden="true" style={{ flex: 'none' }}><path d="m9 6 6 6-6 6" /></svg>
              </button>
            )
          })}
        </div>
      </div>

      {selecting && (
        // ดีไซน์: ลอยเหนือแท็บ 104px (= แท็บ 91 + 13) · บน iPhone ขยับตาม safe-area เหมือนแท็บ
        <div style={{ position: 'fixed', left: '0px', right: '0px', maxWidth: '358px', margin: '0 auto', bottom: 'calc(78px + max(26px, env(safe-area-inset-bottom)))', zIndex: 11, padding: '12px', boxSizing: 'border-box', borderRadius: '20px', background: 'rgba(22,25,40,.92)', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 10px 40px rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ flex: 1, fontSize: '14px', color: '#DCE0EA' }}>{sel.length ? sel.map((id) => byId.get(id)?.p.name).join(' ↔ ') : 'ยังไม่ได้เลือก'}</span>
          <a
            href={ready ? `#/compare?a=${sel[0]}&b=${sel[1]}` : undefined}
            aria-disabled={!ready}
            style={{ height: '48px', padding: '0 20px', borderRadius: '14px', background: ready ? 'linear-gradient(135deg,#8A5CFF,#3B6BFF)' : 'rgba(255,255,255,.10)', color: ready ? '#FFFFFF' : '#9AA1B5', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="12" r="5" /><circle cx="16" cy="12" r="5" /></svg>เปรียบเทียบ
          </a>
        </div>
      )}
      <TabBar active="people" />
    </Page>
  )
}
