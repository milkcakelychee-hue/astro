// คอมโพเนนต์กลาง — โครงและค่าตรงตาม design/DesignSystem.dc.html
import type { ComponentChildren, CSSProperties } from 'preact'
type CSS = CSSProperties
import { useState } from 'preact/hooks'

/** กรอบหน้า: พื้นหลังไล่เฉดของแต่ละหน้า (ส่งค่า background ตามไฟล์ดีไซน์ของหน้านั้น) */
export function Page(props: { background: string; light?: boolean; children: ComponentChildren }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '390px',
        margin: '0 auto',
        minHeight: '100dvh',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font)',
        color: props.light ? '#12131A' : 'var(--text)',
        background: props.background,
      }}
    >
      {props.children}
    </div>
  )
}

/** ปุ่มย้อนกลับด้านบน (เช่น "‹ ตั้งค่า") */
export function BackLink(props: { href: string; label: string }) {
  return (
    <div style={{ padding: '54px 12px 0', display: 'flex', alignItems: 'center' }}>
      <a href={props.href} style={{ height: '44px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', textDecoration: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
        {props.label}
      </a>
    </div>
  )
}

export interface IntroRows {
  what: string
  use: string
  why: string
}

/** หัวข้อหน้า + ปุ่ม ? (คืออะไร · ใช้ดู · ทำไมสำคัญ) */
export function PageTitle(props: { kicker?: string; title: string; en?: string; intro: IntroRows }) {
  const row = (k: string, v: string) => (
    <div style={{ display: 'flex', gap: '10px' }}>
      <span style={{ flex: 'none', width: '78px', color: 'var(--label)' }}>{k}</span>
      <span style={{ flex: 1, minWidth: '0px', color: '#E6E9F2' }}>{v}</span>
    </div>
  )
  return (
    // ผู้ใช้ขอ: ปุ่ม ? ชิดขวาสุดทุกหน้า — กล่องหัวข้อต้องเต็มความกว้างเสมอ
    <div style={{ position: 'relative', alignSelf: 'stretch', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {props.kicker && <span class="lbl">{props.kicker}</span>}
      <h1 style={{ margin: '0px', fontSize: '26px', fontWeight: 600, lineHeight: '1.3' }}>{props.title}</h1>
      {props.en && <span style={{ fontSize: '13px', color: 'var(--label)' }}>{props.en}</span>}
      <details style={{ marginRight: '-40px' }}>
        <summary
          aria-label="หน้านี้คืออะไร"
          style={{ listStyle: 'none', position: 'absolute', right: '0px', top: '18px', width: '30px', height: '30px', borderRadius: '50%', border: '1px solid rgba(200,210,255,.35)', background: 'rgba(255,255,255,.06)', color: '#D6DEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 15px var(--font)", cursor: 'pointer' }}
        >
          ?
        </summary>
        <div data-intro style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '18px', marginTop: '10px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(200,210,255,.16)', fontSize: '13.5px', lineHeight: '1.6' }}>
          {row('คืออะไร', props.intro.what)}
          {row('ใช้ดู', props.intro.use)}
          {row('ทำไมสำคัญ', props.intro.why)}
        </div>
      </details>
    </div>
  )
}

/** การ์ดมีหัวข้อ 15px/600 + คำกำกับ */
export function Card(props: { title?: string; sub?: string; style?: CSS; children?: ComponentChildren }) {
  return (
    <div class="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', ...props.style }}>
      {props.title && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{props.title}</span>
          {props.sub && <span class="lbl">{props.sub}</span>}
        </div>
      )}
      {props.children}
    </div>
  )
}

/** แท็บสลับ (.seg) */
export function Seg<T extends string>(props: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '4px', borderRadius: '14px', background: 'rgba(255,255,255,.07)' }} role="tablist">
      {props.options.map((o) => (
        <button role="tab" aria-selected={o.value === props.value} class={'seg' + (o.value === props.value ? ' on' : '')} onClick={() => props.onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export type ChipTone = 'good' | 'avoid' | 'warn' | 'neutral'
const CHIP: Record<ChipTone, CSS> = {
  good: { background: 'rgba(124,224,167,.14)', color: '#9FEAC0' },
  avoid: { background: 'rgba(255,107,107,.14)', color: '#FF9A9A' },
  warn: { background: 'rgba(255,176,138,.18)', color: '#FFD0BA' },
  neutral: { background: 'rgba(255,255,255,.08)', color: '#C9CEDC' },
}
/** ป้าย (.chip) */
export function Chip(props: { tone: ChipTone; children: ComponentChildren }) {
  return <span class="chip" style={CHIP[props.tone]}>{props.children}</span>
}

/** ปุ่มเลือก (ไม่เลือก / เลือก) */
export function Toggle(props: { on: boolean; onClick: () => void; children: ComponentChildren }) {
  return (
    <button
      onClick={props.onClick}
      aria-pressed={props.on}
      style={{ height: '34px', padding: '0 12px', borderRadius: '10px', border: '1px solid ' + (props.on ? '#B9A6FF' : 'rgba(255,255,255,.12)'), background: props.on ? 'rgba(185,166,255,.20)' : 'rgba(255,255,255,.04)', color: 'var(--text)', display: 'flex', alignItems: 'center', font: '400 13px var(--font)' }}
    >
      {props.children}
    </button>
  )
}

/** ปุ่มหลัก */
export function PrimaryButton(props: { onClick?: () => void; children: ComponentChildren }) {
  return (
    <button onClick={props.onClick} style={{ height: '42px', padding: '0 18px', borderRadius: '12px', border: 'none', background: 'var(--text)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 14px var(--font)' }}>
      {props.children}
    </button>
  )
}

/** แถบระดับ 3 ขีด */
export function LevelBar(props: { level: 0 | 1 | 2 | 3; color?: string }) {
  const c = props.color ?? '#FF8A65'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '3px' }}>
      {[1, 2, 3].map((i) => <span style={{ height: '5px', borderRadius: '3px', background: i <= props.level ? c : 'rgba(255,255,255,.10)' }} />)}
    </div>
  )
}

/** ลูกศร กาง/พับ (.chv) */
export function Chevron(props: { open: boolean; size?: number }) {
  const s = props.size ?? 16
  return (
    <span class="chv" data-o={String(props.open)} style={{ color: 'var(--label)', display: 'flex' }}>
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6" /></svg>
    </span>
  )
}

/** state กาง/พับ */
export function useToggle(initial = false): [boolean, () => void] {
  const [v, set] = useState(initial)
  return [v, () => set((x) => !x)]
}
