import { describe, expect, it } from 'vitest'
import { fixText } from '../src/ui/linebreak.ts'
const NB = ' '
describe('กฎตัดบรรทัด', () => {
  it('วงเล็บอังกฤษเป็นก้อนเดียว ตัดได้หลังจุลภาค', () => {
    expect(fixText('ปฏิทิน (Personal calendar)')).toBe(`ปฏิทิน (Personal${NB}calendar)`)
    expect(fixText('(Secondary Progressions, Solar Arc)')).toBe(`(Secondary${NB}Progressions, Solar${NB}Arc)`)
    expect(fixText('(Square · Opposition)')).toBe(`(Square${NB}·${NB}Opposition)`)
    expect(fixText('(ดวงจันทร์ กลับ)')).toBe('(ดวงจันทร์ กลับ)')
  })
  it('วันที่ไทยไม่แยก', () => {
    expect(fixText('ตรงพอดีวันที่ 21 พ.ค. 2572 ช่วง')).toBe(`ตรงพอดีวันที่ 21${NB}พ.ค.${NB}2572 ช่วง`)
    expect(fixText('5 พฤศจิกายน พ.ศ. 2569')).toBe(`5${NB}พฤศจิกายน พ.ศ.${NB}2569`)
  })
})
