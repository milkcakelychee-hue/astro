// ค่าที่ผู้ใช้ตั้ง (หน้า Settings) — เก็บใน localStorage ของเครื่องนี้
export type PointToggle = 'L' | 'c' | 'ast' | 'F' | 'south' | 'X'
/** ค่าเริ่มต้นตาม design/Settings.dc.html (defOff 2,3,5 = ดาวเคราะห์น้อย, จุดโชคลาภ, Vertex) */
const DEF: Record<PointToggle, boolean> = { L: true, c: true, ast: false, F: false, south: true, X: false }

export function showPoint(k: PointToggle): boolean {
  try {
    const v = localStorage.getItem('pt:' + k)
    if (v === '1' || v === '0') return v === '1'
  } catch { /* ไม่มี storage */ }
  return DEF[k]
}
export function setShowPoint(k: PointToggle, on: boolean) {
  try { localStorage.setItem('pt:' + k, on ? '1' : '0') } catch { /* ignore */ }
}
