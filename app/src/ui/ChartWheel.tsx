// วงชาร์ตเกิด (SVG 340×340) — รูปทรง รัศมี สี และขนาดตัวอักษรตาม Main.dc.html
// ลัคนาอยู่ซ้าย (180°) จักรราศีทวนเข็ม
import type { Aspect } from '../engine/aspects.ts'
import type { Chart, Pt } from '../engine/chart.ts'
import { ASPECT_COLOR, ELEMENT_COLOR, glyph, SIGN_GLYPH } from './astro-labels.ts'

const C = 170
const R_OUT = 166
const R_IN = 140
const R_CORE = 64
const R_SIGN = 153
const R_GLYPH = 122
const R_DEG = 107
const R_HNUM = 72
const MIN_SEP = 9.5

const WHEEL_PTS: Pt[] = ['S', 'M', 'm', 'V', 'a', 'J', 's', 'U', 'N', 'P', 'n', 'L', 'c']
const MINOR = new Set<Pt>(['n', 'L', 'c'])
const LINE_PTS = new Set<Pt>([...WHEEL_PTS, 'A', 'C'])

const f1 = (n: number) => n.toFixed(1)

/** กระจายตำแหน่งสัญลักษณ์ไม่ให้ทับกัน (องศาจักรราศี) */
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

export function ChartWheel(props: { chart: Chart; aspects: Aspect[]; label: string; showHouses: boolean }) {
  const { chart, aspects } = props
  const asc = chart.pos.A.lon
  const xy = (lon: number, r: number) => {
    const t = ((180 + lon - asc) * Math.PI) / 180
    return [C + r * Math.cos(t), C - r * Math.sin(t)] as const
  }
  const line = (lon: number, r1: number, r2: number) => {
    const [x1, y1] = xy(lon, r1)
    const [x2, y2] = xy(lon, r2)
    return { x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2) }
  }
  const txt = { 'text-anchor': 'middle', 'dominant-baseline': 'central' } as const

  const lons = WHEEL_PTS.map((p) => chart.pos[p].lon)
  const shown = spread(lons)
  const [acx, acy] = xy(asc, R_OUT)
  const [mcx, mcy] = xy(chart.pos.C.lon, R_OUT - 8)

  return (
    <svg viewBox="0 0 340 340" width="100%" role="img" aria-label={props.label} style={{ display: 'block' }}>
      <circle cx="170" cy="170" r={R_OUT} style={{ fill: 'var(--ring)', stroke: 'var(--line)' }} />
      <circle cx="170" cy="170" r={R_IN} style={{ fill: 'var(--ground2)', stroke: 'var(--line)' }} />
      <circle cx="170" cy="170" r={R_CORE} style={{ fill: 'var(--core)', stroke: 'var(--line)' }} />
      {SIGN_GLYPH.map((g, i) => {
        const [x, y] = xy(i * 30 + 15, R_SIGN)
        return (
          <>
            <line {...line(i * 30, R_OUT, R_IN)} style={{ stroke: 'var(--line)' }} />
            <text x={f1(x)} y={f1(y)} {...txt} font-size="14" style={{ fill: ELEMENT_COLOR[i % 4] }}>{g}</text>
          </>
        )
      })}
      {props.showHouses &&
        chart.cusps.map((cu, i) => {
          const next = chart.cusps[(i + 1) % 12]!
          const mid = cu + (((next - cu + 360) % 360) / 2)
          const [x, y] = xy(mid, R_HNUM)
          return (
            <>
              <line {...line(cu, R_IN, R_CORE)} style={{ stroke: 'var(--line2)' }} stroke-width={i % 3 === 0 ? '1.8' : '0.6'} />
              <text x={f1(x)} y={f1(y)} {...txt} font-size="7.5" style={{ fill: 'var(--muted)' }}>{i + 1}</text>
            </>
          )
        })}
      {aspects
        .filter((a) => a.type !== '0' && LINE_PTS.has(a.a) && LINE_PTS.has(a.b) && (props.showHouses || (a.a !== 'A' && a.a !== 'C' && a.b !== 'A' && a.b !== 'C')))
        .map((a) => {
          const [x1, y1] = xy(chart.aspectPos[a.a].lon, R_CORE)
          const [x2, y2] = xy(chart.aspectPos[a.b].lon, R_CORE)
          return <line x1={f1(x1)} y1={f1(y1)} x2={f1(x2)} y2={f1(y2)} style={{ stroke: ASPECT_COLOR[a.type] }} stroke-width="1" />
        })}
      {WHEEL_PTS.map((p, i) => {
        const minor = MINOR.has(p)
        const [gx, gy] = xy(shown[i]!, R_GLYPH)
        const [dx, dy] = xy(shown[i]!, R_DEG)
        return (
          <>
            <line {...line(lons[i]!, R_IN, R_IN - 5)} style={{ stroke: 'var(--fg)' }} />
            <text x={f1(gx)} y={f1(gy)} {...txt} font-size={minor ? '12' : '14'} style={{ fill: minor ? 'var(--muted)' : 'var(--fg)' }}>{glyph(p)}</text>
            <text x={f1(dx)} y={f1(dy)} {...txt} font-size="7.5" style={{ fill: 'var(--muted)' }}>{Math.floor(lons[i]! % 30)}°</text>
          </>
        )
      })}
      {props.showHouses && (
        <>
          <text x={f1(Math.max(2, acx - 8))} y={f1(acy - 5)} font-size="9" font-weight="700" style={{ fill: 'var(--accent)' }}>AC</text>
          <text x={f1(mcx - 7)} y={f1(mcy)} font-size="9" font-weight="700" style={{ fill: 'var(--accent)' }}>MC</text>
        </>
      )}
    </svg>
  )
}
