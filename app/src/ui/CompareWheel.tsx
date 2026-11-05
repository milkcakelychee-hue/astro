// วงซ้อน (Synastry) และวงชาร์ตความสัมพันธ์ (Composite/Davison) — รัศมี สี ตาม design/Compare.dc.html
// หมุนให้ลัคนาของคนวงในอยู่ซ้าย (เหมือนวงชาร์ตเกิด) จักรราศีทวนเข็ม
import type { Chart, Pt } from '../engine/chart.ts'
import type { SynAspect } from '../engine/synastry.ts'
import { SIGN_GLYPH, glyph } from './astro-labels.ts'

const C = 170
const PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P']
const EL = ['var(--fire)', 'var(--earth)', 'var(--air)', 'var(--water)']
const ASP_VAR: Record<string, string> = { '0': 'var(--air)', '6': 'var(--sext)', '4': 'var(--sq)', '3': 'var(--trine)', '8': 'var(--opp)' }
const MIN_SEP = 9.5
const f1 = (n: number) => n.toFixed(1)

/** กระจายสัญลักษณ์ไม่ให้ทับกัน */
function spread(lons: number[]): number[] {
  const n = lons.length
  const idx = lons.map((l, i) => [l, i] as const).sort((a, b) => a[0] - b[0])
  const pos = idx.map(([l]) => l)
  for (let it = 0; it < 100; it++) {
    let moved = false
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n
      let gap = pos[j]! - pos[k]!
      if (j === 0) gap += 360
      if (gap < MIN_SEP) {
        const push = (MIN_SEP - gap) / 2
        pos[k]! -= push
        pos[j]! += push
        moved = true
      }
    }
    if (!moved) break
  }
  const out = new Array<number>(n)
  idx.forEach(([, i], k) => (out[i] = pos[k]!))
  return out
}

export const WHEEL_VARS = {
  '--ground2': '#0C0E18', '--ring': 'rgba(255,255,255,.03)', '--core': 'rgba(90,110,255,.10)', '--line': 'rgba(255,255,255,.16)', '--line2': 'rgba(255,255,255,.30)',
  '--fg': '#F2F4FA', '--muted': '#9AA1B5', '--accent': '#7FB8FF', '--fire': '#FF7A59', '--earth': '#8FD47A', '--air': '#F3D46E', '--water': '#6FB2FF',
  '--opp': '#FF6B6B', '--sq': '#FF8A4C', '--trine': '#4FD1A5', '--sext': '#7FB8FF',
}

function Base(props: { asc: number; children: preact.ComponentChildren; label: string }) {
  const ang = (lon: number) => ((180 + lon - props.asc) * Math.PI) / 180
  const xy = (lon: number, r: number) => [C + r * Math.cos(ang(lon)), C - r * Math.sin(ang(lon))] as const
  return (
    <svg viewBox="0 0 340 340" width="100%" role="img" aria-label={props.label} style={{ display: 'block' }}>
      <circle cx={C} cy={C} r={166} style={{ fill: 'var(--ring)', stroke: 'var(--line)' }} />
      <circle cx={C} cy={C} r={142} style={{ fill: 'var(--ground2)', stroke: 'var(--line)' }} />
      <circle cx={C} cy={C} r={70} style={{ fill: 'var(--core)', stroke: 'var(--line)' }} />
      {SIGN_GLYPH.map((g, i) => {
        const [x1, y1] = xy(i * 30, 166)
        const [x2, y2] = xy(i * 30, 142)
        const [tx, ty] = xy(i * 30 + 15, 154)
        return (
          <>
            <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} style={{ stroke: 'var(--line)' }} />
            <text x={f1(tx)} y={f1(ty)} text-anchor="middle" dominant-baseline="central" font-size="12" style={{ fill: EL[i % 4] }}>{g}</text>
          </>
        )
      })}
      {props.children}
    </svg>
  )
}

const planetGlyphs = (chart: Chart, asc: number, r: number, fill: string) => {
  const ang = (lon: number) => ((180 + lon - asc) * Math.PI) / 180
  const sp = spread(PTS.map((p) => chart.pos[p].lon))
  return PTS.map((p, i) => (
    <text x={f1(C + r * Math.cos(ang(sp[i]!)))} y={f1(C - r * Math.sin(ang(sp[i]!)))} text-anchor="middle" dominant-baseline="central" font-size="13" style={{ fill }}>{glyph(p)}</text>
  ))
}

export function SynastryWheel(props: { inner: Chart; outer: Chart; asc: number; aspects: SynAspect[]; label: string; onPick?: (i: number) => void }) {
  const { inner, outer, asc } = props
  const ang = (lon: number) => ((180 + lon - asc) * Math.PI) / 180
  const at = (lon: number) => [C + 70 * Math.cos(ang(lon)), C - 70 * Math.sin(ang(lon))] as const
  return (
    <Base asc={asc} label={props.label}>
      <circle cx={C} cy={C} r={112} style={{ fill: 'none', stroke: 'var(--line)' }} stroke-dasharray="2 3" />
      {props.aspects.map((a, i) => {
        const [x1, y1] = at(inner.pos[a.a].lon)
        const [x2, y2] = at(outer.pos[a.b].lon)
        return (
          <g onClick={() => props.onPick?.(i)} style={{ cursor: 'pointer' }}>
            {/* เส้นบางตามดีไซน์ + เส้นโปร่งกว้างให้แตะง่าย */}
            <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} style={{ stroke: 'transparent', strokeWidth: '10px' }} />
            <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} style={{ stroke: ASP_VAR[a.type] }} />
          </g>
        )
      })}
      {planetGlyphs(outer, asc, 127, '#6FE0C0')}
      {planetGlyphs(inner, asc, 95, '#C9B8FF')}
    </Base>
  )
}

export function SingleWheel(props: { chart: Chart; asc: number; label: string }) {
  return <Base asc={props.asc} label={props.label}>{planetGlyphs(props.chart, props.asc, 115, 'var(--fg)')}</Base>
}
