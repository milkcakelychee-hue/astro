// design/Timeline.dc.html: 18 เหตุการณ์ตัวอย่าง (5 ปีจาก 1 พ.ย. 2569) ต้องอยู่ในผลครบ วันที่/ประเภท/ครั้งใหญ่ตรง
import { beforeAll, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { timelineEvents } from '../src/engine/timeline.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { ASPECT_CODE } from '../src/lib/interp.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const E: [string, string[], string, number][] = [
  ['UqV', ['2026-11-11', '2027-05-02'], 'change', 0], ['JqM', ['2027-01-28', '2027-06-23'], 'opp', 0], ['stS', ['2027-02-25'], 'opp', 0],
  ['JtC', ['2027-03-20', '2027-05-07'], 'opp', 0], ['UoP', ['2027-07-02', '2027-12-04', '2028-04-20'], 'change', 0], ['JcV', ['2027-08-15'], 'opp', 0],
  ['JoA', ['2027-09-30'], 'opp', 0], ['scJ', ['2028-05-18'], 'test', 0], ['UqA', ['2028-09-04', '2028-10-03', '2029-06-01'], 'change', 1],
  ['scs', ['2029-05-21'], 'test', 1], ['scM', ['2029-07-31', '2029-10-14', '2030-04-13'], 'test', 0], ['UoC', ['2029-08-15', '2029-11-02', '2030-05-28'], 'change', 1],
  ['Jca', ['2029-11-27'], 'opp', 0], ['JoM', ['2030-01-21', '2030-05-05', '2030-09-20'], 'opp', 0], ['NtS', ['2030-05-26', '2030-09-07', '2031-03-25'], 'opp', 0],
  ['soP', ['2030-08-15', '2030-10-27', '2031-04-27'], 'test', 0], ['JcC', ['2031-01-13'], 'opp', 1], ['PoS', ['2031-03-09', '2031-07-25'], 'change', 1],
]
const fd = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.y}-${String(p.mo).padStart(2, '0')}-${String(p.d).padStart(2, '0')}` }

it('ครอบคลุมเหตุการณ์ในดีไซน์', () => {
  const nat = computeChart(swe, { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 })
  const a = swe.julday(2026, 11, 1, -7)
  const ev = timelineEvents(swe, nat, a, a + 365.25 * 5, true)
  const got = new Map(ev.map((e) => [e.t + ASPECT_CODE[e.type] + e.n, e]))
  // UoP soP = มุมกับพลูโตเดิม ไม่อยู่ในเกณฑ์ที่ผู้ใช้เลือก (ดาวเกิดส่วนตัว + AC MC)
  for (const [k, d, kind, big] of E.filter(([k]) => !k.endsWith('P'))) {
    const e = got.get(k)
    expect(e, k).toBeTruthy()
    expect([k, e!.passes.filter((x) => x >= a && x <= a + 365.25 * 5).map(fd)]).toEqual([k, d])
    expect([k, e!.kind, e!.big]).toEqual([k, kind, !!big])
  }
  expect(ev.some((e) => e.type === '6')).toBe(false)
  expect(ev.some((e) => e.n === 'P')).toBe(false)
}, 60000)
