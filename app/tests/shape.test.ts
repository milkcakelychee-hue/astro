import { expect, it } from 'vitest'
import { chartShape } from '../src/engine/shape.ts'
it('shapes', () => {
  // ชาร์ตตัวอย่าง 5 ส.ค. 2542 (ช่องว่างกว้างสุด 79.5° · ช่อง ≥60° สามช่อง)
  expect(chartShape([132.7, 53.8, 118.6, 154.3, 223.7, 34.4, 46.7, 314.9, 302.7, 247.8])).toBe('splash')
  expect(chartShape([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])).toBe('bundle')
  expect(chartShape([0, 20, 40, 60, 80, 100, 120, 140, 160, 175])).toBe('bowl')
  expect(chartShape([0, 20, 40, 60, 80, 100, 120, 140, 160, 270])).toBe('bucket')
  expect(chartShape([0, 25, 50, 75, 100, 125, 150, 175, 200, 235])).toBe('locomotive')
  expect(chartShape([0, 10, 20, 30, 40, 180, 190, 200, 210, 220])).toBe('seesaw')
})
