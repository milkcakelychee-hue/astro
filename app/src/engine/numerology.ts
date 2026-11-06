// เลขศาสตร์แบบพีทาโกรัส (docs/04): เลขชีวิต ปีส่วนตัว เดือนส่วนตัว · ไม่มีเลขจากชื่อ (ผู้ใช้ตัดออก 6 พ.ย. 2569)
const digits = (n: number) => String(n).split('').map(Number)
/** ลดเป็นหลักเดียว · keepMaster = คง 11/22/33 · คืนขั้นตอนด้วย */
export function reduce(n: number, keepMaster = false): { n: number; steps: string[] } {
  const steps: string[] = []
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) {
    const ds = digits(n), s = ds.reduce((a, b) => a + b, 0)
    steps.push(`${ds.join('+')} = ${s}`)
    n = s
  }
  return { n, steps }
}
export function lifePath(y: number, mo: number, d: number) {
  const D = reduce(d), M = reduce(mo), Y = reduce(y)
  const sum = D.n + M.n + Y.n
  const L = reduce(sum, true)
  return { n: L.n, d: D, mo: M, y: Y, sum, steps: L.steps }
}
export const personalYear = (bd: number, bm: number, year: number) => reduce(reduce(bd).n + reduce(bm).n + reduce(year).n).n
export const personalMonth = (py: number, month: number) => reduce(py + month).n
