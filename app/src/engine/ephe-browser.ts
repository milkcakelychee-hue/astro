// โหลด Swiss Ephemeris ในเบราว์เซอร์: ดึงไฟล์ .se1 (service worker cache ไว้ใช้ออฟไลน์)
import { createSwe, type Swe } from './swe.ts'

export const EPHE_FILES = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1']

let sweP: Promise<Swe> | null = null
export function getBrowserSwe(): Promise<Swe> {
  sweP ??= (async () => {
    const base = import.meta.env.BASE_URL + 'ephe/'
    const entries = await Promise.all(
      EPHE_FILES.map(async (f) => {
        const r = await fetch(base + f)
        if (!r.ok) throw new Error(`โหลด ${f} ไม่สำเร็จ (${r.status})`)
        return [f, new Uint8Array(await r.arrayBuffer())] as const
      }),
    )
    return createSwe(Object.fromEntries(entries))
  })()
  sweP.catch(() => (sweP = null))
  return sweP
}
