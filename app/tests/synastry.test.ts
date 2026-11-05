// Synastry ชาร์ตหลัก × ชาร์ตคู่ (docs/08: astro-seek Love Compatibility 8/8) — ค่าคาดหวังจาก design/Compare.dc.html
import { beforeAll, describe, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { composite, davison, synastry } from '../src/engine/synastry.ts'
import { floorMin, PLANETS, type Pt } from '../src/engine/chart.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })

describe('synastry', () => {
  it('8 มุมแน่นสุดตรงกับดีไซน์ (orb ลิปดา)', () => {
    const A = computeChart(swe, { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 })
    const B = computeChart(swe, { y: 2000, mo: 5, d: 31, hh: 13, mi: 52, lat: 13 + 45 / 60, lon: 100 + 30 / 60 })
    const got = synastry(A, B).map((x) => `${x.a}${x.type}${x.b} ${Math.floor(x.orb)}°${String(Math.floor((x.orb * 60) % 60)).padStart(2, '0')}`)
    // จันทร์☌พฤหัส 0°28 · พลูโต☍ศุกร์ 0°41 · จันทร์☌เสาร์ 0°45 · อาทิตย์△พลูโต 1°07 · พลูโต⚹เนปจูน 1°21 · พฤหัส□เนปจูน 2°04 · พลูโต☍อาทิตย์ 2°20 · อาทิตย์⚹อาทิตย์ 2°34
    const exp = ['M0J 0°28', 'P8V 0°41', 'M0s 0°45', 'S3P 1°07', 'P6N 1°21', 'J4N 2°04', 'P8S 2°20', 'S6S 2°34']
    // วงล้อในดีไซน์มี 12 เส้น = มุมทั้งหมด ≤3°; รายการแสดง 8 แรก
    expect(got.slice(0, 8)).toEqual(exp)
    expect(got.length).toBe(12)
  })
  const IA = { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 }
  const IB = { y: 2000, mo: 5, d: 31, hh: 13, mi: 52, lat: 13 + 45 / 60, lon: 100 + 30 / 60 }
  const dm = (l: number) => { const t = floorMin(((l % 30) + 30) % 30); return `${Math.floor(t / 60)}°${String(t % 60).padStart(2, '0')}` }
  const check = (ch: ReturnType<typeof computeChart>, exp: Record<string, [string, number]>, asc: string, mc: string) => {
    const got: Record<string, [string, number]> = {}
    for (const p of PLANETS) got[p] = [dm(ch.pos[p as Pt].lon), ch.house(ch.pos[p as Pt].lon)]
    expect(got).toEqual(exp)
    expect([dm(ch.pos.A.lon), dm(ch.pos.C.lon)]).toEqual([asc, mc])
  }
  it('Composite ตรง astro-seek (Midpoint, short-arc MC) ดาว+เรือน+AC/MC', () => {
    const A = computeChart(swe, IA), B = computeChart(swe, IB)
    check(composite(A, B), {
      S: ['11°24', 7], M: ['16°36', 5], m: ['15°07', 7], V: ['20°41', 7], a: ['1°21', 9], J: ['13°50', 5], s: ['19°51', 5], U: ['17°51', 2], N: ['4°34', 2], P: ['9°41', 12],
    }, '23°20', '25°08')
  })
  it('Davison ตรง astro-seek ดาว+เรือน+AC/MC', () => {
    check(davison(swe, IA, IB), {
      S: ['11°18', 7], M: ['24°23', 5], m: ['3°19', 7], V: ['2°41', 6], a: ['28°40', 9], J: ['25°17', 10], s: ['10°22', 11], U: ['14°51', 8], N: ['3°13', 8], P: ['11°29', 6],
    }, '0°35', '24°14')
  })
})
