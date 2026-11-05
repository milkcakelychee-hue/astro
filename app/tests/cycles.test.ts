// การ์ด "เหตุการณ์สำคัญที่กำลังมา" (design/Forecast.dc.html) + วันที่ใน design/Cycles.dc.html
import { beforeAll, describe, expect, it } from 'vitest'
import { computeChart } from '../src/engine/chart.ts'
import { nextCycleEvent, nextMajorEvent } from '../src/engine/cycles.ts'
import { dateOfJd, thaiParts } from '../src/engine/sky.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => { swe = await getSwe() })
const day = (jd: number) => { const p = thaiParts(dateOfJd(jd)); return `${p.d}/${p.mo}/${p.y + 543}` }

describe('cycles', () => {
  it('ชาร์ตตัวอย่าง ณ 1 พ.ย. 2569: หมุดหมายใหญ่ถัดไป = เสาร์ครบรอบครั้งแรก 21 พ.ค. 2572', () => {
    const A = computeChart(swe, { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 })
    const jd0 = swe.julday(2026, 11, 1, 0 - 7)
    const e = nextMajorEvent(swe, A, jd0)!
    expect([e.p, e.kind, e.nth, day(e.jd)]).toEqual(['s', 'return', 1, '21/5/2572'])
    // Cycles.dc.html: พฤหัสบดีเล็ง 15 ต.ค. 2572 · ยูเรนัสเล็ง 5 ก.ย. 2585 · เนปจูนฉาก 8 มิ.ย. 2582 · พลูโตฉาก 30 เม.ย. 2591
    expect(day(nextCycleEvent(swe, A, 'J', jd0, 20)!.jd)).toBe('15/10/2572')
    const u = nextCycleEvent(swe, A, 'U', jd0, 40)!
    const n = nextCycleEvent(swe, A, 'N', jd0, 40)!
    // พลูโตฉาก: แอปได้ 29 เม.ย. 2591 ดีไซน์ 30 เม.ย. — ตรวจกับ astro-seek ตอนทำหน้า Cycles
    expect([u.kind, day(u.jd), n.kind, day(n.jd)]).toEqual(['opp', '5/9/2585', 'sq1', '8/6/2582'])
  })
})
