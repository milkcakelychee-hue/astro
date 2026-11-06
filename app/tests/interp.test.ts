import { beforeAll, describe, expect, it } from 'vitest'
import { aspectsOf } from '../src/engine/aspects.ts'
import { computeChart, PLANETS, type Pt } from '../src/engine/chart.ts'
import { signOf } from '../src/engine/dominants.ts'
import { aspectKey, houseKey, LIB_ORDER, loadLib, signKey, text, type InterpLib } from '../src/lib/interp.ts'
import { getSwe, loadSeek1, loadSeek2 } from './helpers.ts'

let lib: InterpLib
beforeAll(async () => {
  lib = await loadLib()
})

describe('คลังข้อความ', () => {
  it('มีครบ 14 หมวดตาม docs/03 และจำนวนคีย์ตามที่สร้าง', () => {
    const n = Object.fromEntries(Object.entries(lib).map(([k, v]) => [k, Object.keys(v).length]))
    expect(n).toEqual({
      planet_sign: 180, planet_house: 156, aspect: 520, transit: 650, transit_house: 120, synastry: 700, eclipse: 64,
      moon: 21, retrograde: 10, return: 84, direction: 2340, cycle: 44, numerology: 30, electional: 10,
    })
  })

  it('ทุกดาว/ทุกมุมใน 41 ชาร์ตทดสอบหาข้อความเจอ (ยกเว้นจุดที่คลังไม่มี: F X D I)', async () => {
    const swe = await getSwe()
    const missing = new Set<string>()
    for (const c of [...loadSeek1(), ...loadSeek2()]) {
      const ch = computeChart(swe, c.input)
      for (const p of LIB_ORDER) {
        if (!text(lib, 'planet_sign', signKey(p, signOf(ch.pos[p].lon)))) missing.add('sign ' + p)
        if (!['A', 'C'].includes(p) && !text(lib, 'planet_house', houseKey(p, ch.house(ch.pos[p].lon)))) missing.add('house ' + p)
      }
      for (const a of aspectsOf(swe, c.input, ch)) {
        if ([a.a, a.b].some((x) => !LIB_ORDER.includes(x))) continue
        if (!text(lib, 'aspect', aspectKey(a.a, a.b, a.type))) missing.add(aspectKey(a.a, a.b, a.type))
      }
    }
    expect([...missing]).toEqual([])
  })

  it('ตัวอย่างคีย์ตาม docs/03', () => {
    expect(aspectKey('a', 'S', '4')).toBe('Sqa')
    expect(text(lib, 'aspect', 'Sqa')).toMatch(/^อาทิตย์ฉากอังคาร/)
    expect(text(lib, 'planet_sign', 'S4')).toMatch(/^อาทิตย์ราศีสิงห์/)
    expect(text(lib, 'aspect', 'nope')).toBeNull()
    expect(PLANETS.every((p: Pt) => LIB_ORDER.includes(p))).toBe(true)
  })
})
