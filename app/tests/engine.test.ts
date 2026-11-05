import { beforeAll, describe, expect, it } from 'vitest'
import { computeChart, floorMin, PLANETS, type Pt } from '../src/engine/chart.ts'
import { aspectsOf } from '../src/engine/aspects.ts'
import { dominantElements, dominants, signature } from '../src/engine/dominants.ts'
import { PROVINCES, latOf, lonOf } from '../src/engine/places.ts'
import { akey, getSwe, loadSeek1, loadSeek2 } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => {
  swe = await getSwe()
})

const SEEK1 = loadSeek1()
const SEEK2 = loadSeek2()
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

const label = (i: { y: number; mo: number; d: number }, city: string) => `${i.y}-${i.mo}-${i.d} ${city}`

describe('seek.txt (11 ชาร์ต): ตำแหน่ง เรือน มุม ดาวเด่น ธาตุ', () => {
  it('ตำแหน่ง + ถอยหลัง + เรือน + ปลายเรือน ตรง 100%', () => {
    const bad: string[] = []
    let total = 0
    for (const c of SEEK1) {
      const ch = computeChart(swe, c.input)
      for (const [k, e] of Object.entries(c.pos)) {
        const p = ch.pos[k as Pt]
        total++
        const got = { min: floorMin(p.lon), retro: p.speed < 0, house: ['A', 'C'].includes(k) ? null : ch.house(p.lon) }
        if (got.min !== e.min || got.retro !== e.retro || got.house !== e.house) {
          bad.push(`${label(c.input, c.city)} ${k} got ${JSON.stringify(got)} exp ${JSON.stringify(e)}`)
        }
      }
      ch.cusps.forEach((cu, i) => {
        total++
        if (floorMin(cu) !== c.cusps[i]) bad.push(`${label(c.input, c.city)} cusp${i + 1} got ${floorMin(cu)} exp ${c.cusps[i]}`)
      })
    }
    expect(bad).toEqual([])
    expect(total).toBeGreaterThan(300)
  })

  it('มุม orb + Applying/Separating ตรง 100%', () => {
    const bad: string[] = []
    for (const c of SEEK1) {
      const got = aspectsOf(swe, c.input)
      const exp = { ...c.pa, ...c.oa }
      const gotMap = new Map(got.map((a) => [akey(a.a, a.b, a.type), a]))
      for (const [k, [orb, flag]] of Object.entries(exp)) {
        const g = gotMap.get(k)
        if (!g) bad.push(`${label(c.input, c.city)} missing ${k}`)
        else if (g.orbMin !== orb || (g.applying ? 'A' : 'S') !== flag) {
          bad.push(`${label(c.input, c.city)} ${k} got ${g.orbMin}${g.applying ? 'A' : 'S'} exp ${orb}${flag}`)
        }
      }
      for (const k of gotMap.keys()) if (!(k in exp)) bad.push(`${label(c.input, c.city)} extra ${k}`)
    }
    expect(bad).toEqual([])
  })

  it('ดาวเด่น (Modern) ตรง 100%', () => {
    const bad: string[] = []
    for (const c of SEEK1) {
      const d = dominants(computeChart(swe, c.input))
      d.rows.forEach((r, i) => {
        const got = [r.sign, r.house, r.angle, r.ruler, r.aspects, r.total]
        if (got.join('.') !== c.dom[i]!.join('.')) bad.push(`${label(c.input, c.city)} ${r.planet} got ${got.join('.')} exp ${c.dom[i]!.join('.')}`)
      })
    }
    expect(bad).toEqual([])
  })

  it('ธาตุเด่น ตรง 100%', () => {
    const bad: string[] = []
    for (const c of SEEK1) {
      const ch = computeChart(swe, c.input)
      const el = dominantElements(ch, dominants(ch))
      el.forEach((e, i) => {
        const got = [e.lights, e.inner, e.outer, e.top3, e.total]
        if (got.join('.') !== c.el[i]!.join('.')) bad.push(`${label(c.input, c.city)} el${i} got ${got.join('.')} exp ${c.el[i]!.join('.')}`)
      })
    }
    expect(bad).toEqual([])
  })
})

describe('seek2.txt (30 ชาร์ต): ดาวเด่น ธาตุ Signature จำนวนมุม Fortune/Vertex', () => {
  it('ดาวเด่น + ธาตุ + Signature ตรง 100%', () => {
    const bad: string[] = []
    for (const c of SEEK2) {
      const ch = computeChart(swe, c.input)
      const d = dominants(ch)
      d.rows.forEach((r, i) => {
        const got = [r.sign, r.house, r.angle, r.ruler, r.aspects, r.total].join('.')
        if (got !== c.dom[i]!.join('.')) bad.push(`${label(c.input, c.city)} dom ${r.planet} got ${got} exp ${c.dom[i]!.join('.')}`)
      })
      dominantElements(ch, d).forEach((e, i) => {
        const got = [e.lights, e.inner, e.outer, e.top3, e.total].join('.')
        if (got !== c.el[i]!.join('.')) bad.push(`${label(c.input, c.city)} el${i} got ${got} exp ${c.el[i]!.join('.')}`)
      })
      const s = signature(ch)
      const gotSig = s.ambiguous ? 'Ambiguous' : SIGNS[s.sign]
      if (gotSig !== c.sig) bad.push(`${label(c.input, c.city)} sig got ${gotSig} exp ${c.sig}`)
    }
    expect(bad).toEqual([])
  })

  it('จำนวนมุมที่แสดง + มุม Fortune/Vertex (orb, A/S) ตรง', () => {
    const bad: string[] = []
    for (const c of SEEK2) {
      const got = aspectsOf(swe, c.input)
      if (got.length !== c.n) bad.push(`${label(c.input, c.city)} count got ${got.length} exp ${c.n}`)
      const gotMap = new Map(got.map((a) => [akey(a.a, a.b, a.type), a]))
      for (const e of c.xf) {
        const g = gotMap.get(akey(e.a, e.b, e.t))
        if (!g) bad.push(`${label(c.input, c.city)} missing ${e.a}${e.t}${e.b}`)
        else if (g.orbMin !== e.orb || (g.applying ? 'A' : 'S') !== e.flag) {
          bad.push(`${label(c.input, c.city)} ${e.a}${e.t}${e.b} got ${g.orbMin}${g.applying ? 'A' : 'S'} exp ${e.orb}${e.flag}`)
        }
      }
    }
    // ค่าคลาดที่บันทึกไว้แล้วใน docs/01 (Fortune orb 205/208 — โค้ดอ้างอิง Python ก็ได้ผลเดียวกัน)
    const KNOWN = [
      '2006-2-19 Loei F3L got 285A exp 286A',
      '2026-11-18 Chon Buri F3V got 257S exp 258S',
      '2026-6-24 Phuket F4U got 303A exp 302A',
    ]
    expect(bad).toEqual(KNOWN)
  })
})

describe('พิกัดจังหวัด', () => {
  it('มี 77 จังหวัด และพิกัดของทุกชาร์ตทดสอบตรงตาราง', () => {
    expect(PROVINCES).toHaveLength(77)
    const bad: string[] = []
    for (const c of [...SEEK1, ...SEEK2]) {
      const p = PROVINCES.find((x) => x.name === c.city)
      if (!p) bad.push(`ไม่พบจังหวัด ${c.city}`)
      else if (Math.abs(latOf(p) - c.input.lat) > 1e-9 || Math.abs(lonOf(p) - c.input.lon) > 1e-9) bad.push(`พิกัดไม่ตรง ${c.city}`)
    }
    expect(bad).toEqual([])
  })
})

describe('ชาร์ตอ้างอิง docs/02 (5 ส.ค. 2542 20:33 เพชรบุรี)', () => {
  const input = { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 }
  const fmt = (lon: number) => `${SIGNS[Math.floor(lon / 30)]} ${Math.floor(lon % 30)}°${String(Math.floor(((lon % 30) % 1) * 60 + 1e-9)).padStart(2, '0')}′`
  const exp: [Pt, string, number | null][] = [
    ['S', 'Leo 12°41′', 6], ['M', 'Taurus 23°48′', 3], ['m', 'Cancer 28°36′', 5], ['V', 'Virgo 4°18′', 6],
    ['a', 'Scorpio 13°41′', 8], ['J', 'Taurus 4°21′', 2], ['s', 'Taurus 16°39′', 2], ['U', 'Aquarius 14°54′', 12],
    ['N', 'Aquarius 2°42′', 11], ['P', 'Sagittarius 7°47′', 9], ['n', 'Leo 12°55′', 6], ['L', 'Sagittarius 6°50′', 9],
    ['c', 'Scorpio 27°38′', 9], ['F', 'Gemini 3°02′', 3], ['X', 'Virgo 25°00′', 7], ['A', 'Pisces 14°09′', null], ['C', 'Sagittarius 17°54′', null],
  ]
  it('ตำแหน่ง + เรือน ตรง docs/02', () => {
    const ch = computeChart(swe, input)
    const bad = exp.flatMap(([k, s, h]) => {
      const got = `${fmt(ch.pos[k].lon)}${h === null ? '' : ' h' + ch.house(ch.pos[k].lon)}`
      const want = `${s}${h === null ? '' : ' h' + h}`
      return got === want ? [] : [`${k} got ${got} exp ${want}`]
    })
    expect(bad).toEqual([])
  })
  it('มุมดาว 18 + มุมอื่น 34 = 52 รายการ และดาวเด่นรวม 89 (Sun 13)', () => {
    const asp = aspectsOf(swe, input)
    const planetPairs = asp.filter((a) => PLANETS.includes(a.a) && PLANETS.includes(a.b))
    expect(planetPairs).toHaveLength(18)
    expect(asp).toHaveLength(52)
    const d = dominants(computeChart(swe, input))
    expect(d.sum).toBe(89)
    expect(d.rows[0]!.total).toBe(13)
    const s = signature(computeChart(swe, input))
    expect(s).toMatchObject({ ambiguous: false, sign: 1, elementCount: 4, modalityCount: 7 })
  })
})
