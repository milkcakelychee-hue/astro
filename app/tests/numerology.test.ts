import { expect, it } from 'vitest'
import { lifePath, personalMonth, personalYear } from '../src/engine/numerology.ts'
it('design sample 5 ส.ค. 1999', () => {
  const L = lifePath(1999, 8, 5)
  expect(L.n).toBe(5)
  expect(L.y.steps).toEqual(['1+9+9+9 = 28', '2+8 = 10', '1+0 = 1'])
  expect(L.sum).toBe(14)
  expect(personalYear(5, 8, 2026)).toBe(5)
  expect(personalMonth(5, 11)).toBe(7)
  expect(personalYear(5, 8, 2027)).toBe(6)
  expect([2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => personalYear(5, 8, y))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
})
