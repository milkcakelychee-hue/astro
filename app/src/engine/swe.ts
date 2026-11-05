// ตัวห่อ Swiss Ephemeris (WASM) — โหลดไฟล์ .se1 เข้าระบบไฟล์เสมือน
import SwissEph from 'swisseph-wasm'

export type Swe = SwissEph
export type EpheFiles = Record<string, Uint8Array>

export const SWIEPH = 2
export const SPEED = 256
export const TRUEPOS = 16
export const ECL_NUT = -1
/** ค่าพิเศษของ swe_set_delta_t_userdef = กลับไปใช้ ΔT อัตโนมัติ */
export const DELTAT_AUTOMATIC = -1e-10

export async function createSwe(files: EpheFiles): Promise<Swe> {
  const swe = new SwissEph()
  await swe.initSwissEph()
  // SweModule (Emscripten) ไม่อยู่ใน .d.ts ของแพ็กเกจ
  const fs = (swe as unknown as { SweModule: { FS: { mkdir(p: string): void; writeFile(p: string, d: Uint8Array): void } } }).SweModule.FS
  try {
    fs.mkdir('/eph')
  } catch {
    /* มีอยู่แล้ว */
  }
  for (const [name, bytes] of Object.entries(files)) {
    fs.writeFile('/eph/' + name, bytes)
  }
  swe.set_ephe_path('/eph')
  return swe
}
