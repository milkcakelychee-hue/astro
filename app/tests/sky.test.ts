// หน้า "วันนี้": เทียบกับข้อมูลตัวอย่างใน design/Today.dc.html (31 ต.ค. 2569 10:00 น.) และ docs/08
import { beforeAll, describe, expect, it } from 'vitest'
import { SKY_PTS, bodyAt, dateOfJd, dignityOf, moonInfo, nextIngress, thaiParts } from '../src/engine/sky.ts'
import { floorMin, type Pt } from '../src/engine/chart.ts'
import { getSwe } from './helpers.ts'
import type { Swe } from '../src/engine/swe.ts'

let swe: Swe
beforeAll(async () => {
  swe = await getSwe()
})
const thaiJd = (y: number, mo: number, d: number, hh: number, mi: number) => swe.julday(y, mo, d, hh + mi / 60 - 7)
const fmt = (jd: number) => {
  const p = thaiParts(dateOfJd(jd))
  return `${p.y + 543}-${p.mo}-${p.d} ${String(p.hh).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`
}
const dm = (lon: number) => { const t = floorMin(lon % 30); return `${Math.floor(t / 60)}°${String(t % 60).padStart(2, '0')}` }

describe('Today.dc.html 31 ต.ค. 2569 10:00', () => {
  it('ตำแหน่ง ราศี ถอยหลัง', () => {
    const jd = thaiJd(2026, 10, 31, 10, 0)
    // [องศา, ราศี, R] จากดีไซน์
    const exp: Record<string, [string, number, boolean]> = {
      S: ['7°42', 7, false], M: ['15°00', 3, false], m: ['17°35', 7, true], V: ['26°41', 6, true], a: ['18°10', 4, false],
      J: ['24°12', 4, false], s: ['9°20', 0, true], U: ['4°42', 2, true], N: ['2°06', 0, true], P: ['3°07', 10, false], n: ['26°07', 10, true] // ดีไซน์ 26°58′ = True Node · แอปใช้ Mean (CLAUDE.md, docs/08),
    }
    const got: Record<string, [string, number, boolean]> = {}
    for (const p of SKY_PTS) { const b = bodyAt(swe, jd, p); got[p] = [dm(b.lon), Math.floor(b.lon / 30), b.speed < 0] }
    console.log(got)
    expect(got).toEqual(exp)
  })
  it('ดวงจันทร์ + VOC + ingress', () => {
    const mi = moonInfo(swe, thaiJd(2026, 10, 31, 10, 0))
    console.log(mi.kham, mi.waxing, Math.round(mi.illum * 100), mi.phaseKey, fmt(mi.ingress!.jd), mi.voc && fmt(mi.voc.start))
    expect(fmt(mi.ingress!.jd)).toBe('2569-11-1 11:18') // ดีไซน์ปัดเป็น 11:20
    expect(mi.ingress!.sign).toBe(4)
  })
  it('วันย้ายราศีของดาวอื่น', () => {
    const jd = thaiJd(2026, 10, 31, 10, 0)
    const out: Record<string, string> = {}
    for (const p of ['S', 'm', 'V', 'a', 'J', 's', 'U', 'n'] as Pt[]) {
      const i = nextIngress(swe, jd, p, 12 * 366)
      out[p] = i ? `${fmt(i.jd)} →${i.sign}` : '-'
    }
    console.log(out)
  })
  it('ศักดิ์', () => {
    expect(dignityOf('s', 0)).toBe('fall')
    expect(dignityOf('V', 6)).toBe('dom')
    expect(dignityOf('M', 3)).toBe('dom')
    expect(dignityOf('m', 8)).toBe('detr')
    expect(dignityOf('U', 2)).toBe(null)
  })
})
