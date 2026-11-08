// ชาร์ตปีเก่า (ก่อน 1995) เทียบกับ astro-seek — ตรวจ 8 พ.ย. 2569 หลังขยายปีเกิดถึง พ.ศ. 2509
import { describe, expect, it } from 'vitest'
import { computeChart, floorMin, type Pt } from '../src/engine/chart.ts'
import { getSwe } from './helpers.ts'

const SG = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
const m = (s: string) => { const [sg, d, mi] = s.split(' '); return SG.indexOf(sg!) * 1800 + Number(d) * 60 + Number(mi) }
// [จุด, ตำแหน่ง, เรือน (null = มุมชาร์ต), ถอยหลัง] ตามที่ astro-seek แสดง
type Row = [Pt, string, number | null, boolean]
const CASES: { name: string; input: { y: number; mo: number; d: number; hh: number; mi: number; lat: number; lon: number }; pos: Row[]; cusps: string[] }[] = [
  {
    name: '10 ม.ค. 2509 07:00 กรุงเทพฯ',
    input: { y: 1966, mo: 1, d: 10, hh: 7, mi: 0, lat: 13 + 45 / 60, lon: 100 + 30 / 60 },
    pos: [
      ['S', 'Capricorn 19 17', 12, false], ['M', 'Leo 28 23', 8, false], ['m', 'Capricorn 3 16', 12, false],
      ['V', 'Aquarius 13 26', 1, true], ['a', 'Aquarius 13 58', 1, false], ['J', 'Gemini 23 22', 5, true],
      ['s', 'Pisces 13 10', 2, false], ['U', 'Virgo 19 31', 8, true], ['N', 'Scorpio 21 39', 10, false],
      ['P', 'Virgo 18 21', 8, true], ['n', 'Gemini 2 10', 5, true], ['L', 'Aquarius 20 50', 1, false],
      ['c', 'Pisces 18 45', 2, false], ['F', 'Virgo 1 19', 8, false], ['X', 'Virgo 7 17', 8, false],
      ['A', 'Capricorn 22 13', null, false], ['C', 'Scorpio 1 43', null, false],
    ],
    cusps: ['Capricorn 22 13', 'Aquarius 25 6', 'Pisces 29 30', 'Taurus 1 43', 'Gemini 0 1', 'Gemini 25 53', 'Cancer 22 13', 'Leo 25 6', 'Virgo 29 30', 'Scorpio 1 43', 'Sagittarius 0 1', 'Sagittarius 25 53'],
  },
  {
    name: '20 มิ.ย. 2523 15:30 กรุงเทพฯ',
    input: { y: 1980, mo: 6, d: 20, hh: 15, mi: 30, lat: 13 + 45 / 60, lon: 100 + 30 / 60 },
    pos: [
      ['S', 'Gemini 29 9', 8, false], ['M', 'Virgo 27 19', 11, false], ['m', 'Cancer 22 38', 9, false],
      ['V', 'Gemini 21 15', 8, true], ['a', 'Virgo 19 10', 11, false], ['J', 'Virgo 4 26', 10, false],
      ['s', 'Virgo 20 53', 11, false], ['U', 'Scorpio 22 8', 1, true], ['N', 'Sagittarius 21 4', 2, true],
      ['P', 'Libra 18 59', 12, true], ['n', 'Leo 22 49', 10, true], ['L', 'Libra 8 27', 11, false],
      ['c', 'Taurus 16 29', 7, false], ['F', 'Aquarius 13 13', 3, false], ['X', 'Aquarius 23 51', 4, false],
      ['A', 'Scorpio 15 3', null, false], ['C', 'Leo 14 14', null, false],
    ],
    cusps: ['Scorpio 15 3', 'Sagittarius 14 10', 'Capricorn 13 34', 'Aquarius 14 14', 'Pisces 16 2', 'Aries 16 56', 'Taurus 15 3', 'Gemini 14 10', 'Cancer 13 34', 'Leo 14 14', 'Virgo 16 2', 'Libra 16 56'],
  },
  {
    name: '15 ก.ย. 2513 10:00 กรุงเทพฯ',
    input: { y: 1970, mo: 9, d: 15, hh: 10, mi: 0, lat: 13 + 45 / 60, lon: 100 + 30 / 60 },
    pos: [
      ['S', 'Virgo 21 51', 11, false], ['M', 'Pisces 17 3', 4, false], ['m', 'Virgo 17 15', 10, true],
      ['V', 'Scorpio 7 6', 12, false], ['a', 'Virgo 7 34', 10, false], ['J', 'Scorpio 4 58', 12, false],
      ['s', 'Taurus 22 31', 7, true], ['U', 'Libra 8 4', 11, false], ['N', 'Scorpio 28 28', 1, false],
      ['P', 'Virgo 27 1', 11, false], ['n', 'Pisces 1 40', 4, true], ['L', 'Virgo 1 17', 10, false],
      ['c', 'Aries 8 49', 5, true], ['F', 'Taurus 12 31', 6, false], ['X', 'Aquarius 23 35', 4, false],
      ['A', 'Scorpio 17 20', null, false], ['C', 'Leo 16 42', null, false],
    ],
    cusps: ['Scorpio 17 20', 'Sagittarius 16 24', 'Capricorn 15 52', 'Aquarius 16 42', 'Pisces 18 36', 'Aries 19 24', 'Taurus 17 20', 'Gemini 16 24', 'Cancer 15 52', 'Leo 16 42', 'Virgo 18 36', 'Libra 19 24'],
  },
  {
    name: '1 ก.ค. 2511 12:00 กรุงเทพฯ',
    input: { y: 1968, mo: 7, d: 1, hh: 12, mi: 0, lat: 13 + 45 / 60, lon: 100 + 30 / 60 },
    pos: [
      ['S', 'Cancer 9 24', 10, false], ['M', 'Virgo 10 34', 12, false], ['m', 'Gemini 23 17', 9, false],
      ['V', 'Cancer 12 22', 10, false], ['a', 'Cancer 6 41', 10, false], ['J', 'Virgo 2 24', 11, false],
      ['s', 'Aries 24 24', 7, false], ['U', 'Virgo 25 26', 12, false], ['N', 'Scorpio 24 4', 2, true],
      ['P', 'Virgo 20 25', 12, false], ['n', 'Aries 14 20', 7, true], ['L', 'Gemini 1 23', 8, false],
      ['c', 'Aries 3 21', 6, false], ['F', 'Sagittarius 5 54', 3, false], ['X', 'Pisces 23 16', 6, false],
      ['A', 'Libra 4 44', null, false], ['C', 'Cancer 4 25', null, false],
    ],
    cusps: ['Libra 4 44', 'Scorpio 4 54', 'Sagittarius 4 57', 'Capricorn 4 25', 'Aquarius 4 7', 'Pisces 4 34', 'Aries 4 44', 'Taurus 4 54', 'Gemini 4 57', 'Cancer 4 25', 'Leo 4 7', 'Virgo 4 34'],
  },
]

describe('ชาร์ตปีเก่า เทียบ astro-seek', () => {
  it('ตำแหน่ง เรือน ถอยหลัง และจุดเริ่มเรือน ตรงทุกค่า', async () => {
    const swe = await getSwe()
    const bad: string[] = []
    for (const c of CASES) {
      const ch = computeChart(swe, c.input)
      for (const [k, s, h, r] of c.pos) {
        const p = ch.pos[k]
        const got = [floorMin(p.lon), ['A', 'C'].includes(k) ? null : ch.house(p.lon), !['F', 'X', 'A', 'C'].includes(k) && p.speed < 0]
        const exp = [m(s), h, r]
        if (JSON.stringify(got) !== JSON.stringify(exp)) bad.push(`${c.name} ${k} got ${JSON.stringify(got)} exp ${JSON.stringify(exp)}`)
      }
      ch.cusps.forEach((cu, i) => { if (floorMin(cu) !== m(c.cusps[i]!)) bad.push(`${c.name} cusp${i + 1} got ${floorMin(cu)} exp ${m(c.cusps[i]!)}`) })
    }
    // ต่างจาก astro-seek 1′ (ดู docs/08): ไครอนปี 2509 และจุดเริ่มเรือน 2/8 ที่ค่าอยู่ห่างขอบลิปดาแค่ 0.4″
    const KNOWN = ['10 ม.ค. 2509 07:00 กรุงเทพฯ c ', '10 ม.ค. 2509 07:00 กรุงเทพฯ cusp2 ', '10 ม.ค. 2509 07:00 กรุงเทพฯ cusp8 ']
    expect(bad.filter((b) => !KNOWN.some((k) => b.startsWith(k)))).toEqual([])
  })
})
