import { describe, expect, it } from 'vitest'
import { monthEvents, monthRows, thaiOf } from '../src/engine/ephemeris.ts'
import { readFileSync } from 'node:fs'
import { getSwe } from './helpers.ts'

// ค่าคาดหวังจาก design/Ephemeris.dc.html (พ.ย. 2569) [ราศี, องศา, ลิปดา, R]
const D1 = [[7,8,34,0],[3,27,28,0],[7,16,39,1],[6,26,14,1],[4,18,37,0],[4,24,19,0],[0,9,17,1],[2,4,40,1],[0,2,5,1],[10,3,7,0],[10,26,4,1]]
const D30 = [[8,7,46,0],[4,21,47,0],[7,20,36,0],[6,27,27,0],[5,1,33,0],[4,26,44,0],[0,8,2,1],[2,3,30,1],[0,1,39,1],[10,3,32,0],[10,24,32,1]]
describe('ephemeris', () => {
  it('day 1 and 30 match design', async () => {
    const swe = await getSwe()
    const R = monthRows(swe, 2026, 11)
    expect(R.length).toBe(30)
    const f = (row: typeof R[0]) => row.map((c) => [c.sign, c.deg, c.min, c.r ? 1 : 0])
    expect(f(R[0]!)).toEqual(D1)
    expect(f(R[29]!)).toEqual(D30)
  })
  it('all 330 cells match design', async () => {
    const swe = await getSwe()
    const src = readFileSync(new URL('../../design/Ephemeris.dc.html', import.meta.url), 'utf8')
    const R0: number[][][] = JSON.parse(/var R=(\[.*?\]\]\]);/.exec(src)![1]!)
    const R = monthRows(swe, 2026, 11)
    const bad: string[] = []
    R0.forEach((row, d) => row.forEach((x, i) => { const c = R[d]![i]!; if (c.sign !== x[0] || c.deg !== x[1] || c.min !== x[2] || +c.r !== x[3]) bad.push(`${d + 1}/${i}: ${x} vs ${c.sign},${c.deg},${c.min}`) }))
    expect(bad).toEqual([])
  })
  it('events', async () => {
    const swe = await getSwe()
    const ev = monthEvents(swe, 2026, 11).map((e) => { const t = thaiOf(e.jd); return `${t.d} ${String(t.hh).padStart(2, '0')}:${String(t.mi).padStart(2, '0')} ${e.p}${e.kind}` })
    expect(ev).toEqual(['13 22:53 mD', '14 07:27 VD', '22 14:23 Sin', '26 06:37 ain'])
  })
})
