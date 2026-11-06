import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { electionalDays } from '../src/engine/electional.ts'
import { getSwe } from './helpers.ts'

const SN = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน']
const PN: Record<string, string> = { S: 'อาทิตย์', m: 'พุธ', V: 'ศุกร์', a: 'อังคาร', J: 'พฤหัสบดี', s: 'เสาร์', U: 'ยูเรนัส', N: 'เนปจูน', P: 'พลูโต' }
const TN: Record<string, string> = { '0': 'กุม', '6': 'ฉาก60', '4': 'ฉาก', '3': 'ตรีโกณ', '8': 'เล็ง' }
const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
describe('electional', () => {
  it('vs design sample (4 พ.ย. 2569 + 30 วัน)', async () => {
    const swe = await getSwe()
    const src = readFileSync(new URL('../../design/Electional.dc.html', import.meta.url), 'utf8')
    const D = JSON.parse(/var D=(\[.*?\]\]\]\]);/.exec(src)![1]!)
    const VOC = JSON.parse(/var VOC=(\{.*?\});/.exec(src)![1]!)
    const R = electionalDays(swe, 2026, 11, 4, 30)
    const diff: string[] = []
    R.forEach((r, i) => {
      const x = D[i]
      const id = `${r.d}/${r.mo}`
      if (x[0] !== r.d) diff.push(`${id} day`)
      if (x[2] !== SN[r.sign]) diff.push(`${id} sign ${x[2]} vs ${SN[r.sign]}`)
      if (Math.abs(x[3] - r.elong) > 1.5) diff.push(`${id} elong ${x[3]} vs ${r.elong.toFixed(1)}`)
      if (x[4] !== +r.mercR || x[5] !== +r.venR) diff.push(`${id} rx`)
      const a = x[6].map((y: [number, string, string]) => `${y[1]}${y[2]}`).sort().join(','), b = r.asp.map((y) => `${PN[y.p]}${TN[y.type]}`).sort().join(',')
      // 20/11: ดีไซน์ตกมุมจันทร์ฉาก60ยูเรนัส (ข้อมูลตัวอย่างทำมือ) — ของเราคำนวณจริง
      if (a !== b && !(r.d === 20 && b === a.replace('พลูโตฉาก60,', 'พลูโตฉาก60,ยูเรนัสฉาก60,'))) diff.push(`${id} asp ${a} | ${b}`)
      const v = VOC[`${r.mo}-${r.d}`], w = r.voc ? [hm(r.voc[0]), hm(r.voc[1])] : undefined
      // เวลาเป็นนาทีปัดลงเหมือนหน้า MoonPhases (ตรวจกับ astro-seek ±1 นาที) · ดีไซน์ปัดขึ้นบางวัน
      const mm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3)
      if (!v !== !w || (v && w && (Math.abs(mm(v[0]) - mm(w[0])) > 1 || Math.abs(mm(v[1]) - mm(w[1])) > 1))) diff.push(`${id} voc ${v} | ${w}`)
    })
    expect(diff).toEqual([])
  })
})
