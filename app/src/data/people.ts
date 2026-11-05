// ข้อมูลบุคคล เก็บใน IndexedDB ในเครื่องเท่านั้น (docs/04)
import { openDB, type IDBPDatabase } from 'idb'
import type { BirthInput } from '../engine/chart.ts'
import { latOf, lonOf, provinceByName } from '../engine/places.ts'

export interface Person {
  id: string
  name: string
  /** วันเกิด ค.ศ. (แสดงผลเป็น พ.ศ.) */
  y: number
  mo: number
  d: number
  /** null = ไม่ทราบเวลาเกิด → คำนวณที่ 12:00 และซ่อนลัคนา/เรือน */
  hh: number | null
  mi: number | null
  /** ชื่อจังหวัด (คีย์ภาษาอังกฤษในตาราง PROVINCES) */
  province: string
  /** me | family | friend | lover | work */
  relation: string
  note?: string
  /** ชาร์ตของฉัน */
  isMe: boolean
  createdAt: number
}

let dbP: Promise<IDBPDatabase> | null = null
function db() {
  dbP ??= openDB('astro', 2, {
    upgrade(d, old) {
      if (old < 1) d.createObjectStore('people', { keyPath: 'id' })
      // v2: โน้ตส่วนตัวต่อจุดในชาร์ต (หน้า Sheet) — id = personId:จุด
      if (old < 2) d.createObjectStore('notes', { keyPath: 'id' })
    },
  })
  return dbP
}

export async function listPeople(): Promise<Person[]> {
  return ((await (await db()).getAll('people')) as Person[]).sort((a, b) => a.createdAt - b.createdAt)
}
export async function getPerson(id: string): Promise<Person | null> {
  return ((await (await db()).get('people', id)) as Person | undefined) ?? null
}
/** ป้ายความสัมพันธ์ (ตามหน้าเพิ่มคน) */
export const REL_LABEL: Record<string, string> = { me: 'ฉัน', family: 'ครอบครัว', friend: 'เพื่อน', lover: 'คนรัก', work: 'ที่ทำงาน' }
/** สีวงกลมรูปย่อ ตามดีไซน์ People.dc.html (ที่ทำงาน ใช้สีแถวที่ 5 ของดีไซน์) */
export const REL_AVATAR: Record<string, string> = {
  me: 'linear-gradient(135deg,#8A5CFF,#3B6BFF)', family: 'linear-gradient(135deg,#1FA587,#3B6BFF)', lover: 'linear-gradient(135deg,#C2577A,#8A5CFF)',
  friend: 'linear-gradient(135deg,#3B6BFF,#6EC8FF)', work: 'linear-gradient(135deg,#1FA587,#8FD47A)',
}
export async function getMe(): Promise<Person | null> {
  return (await listPeople()).find((p) => p.isMe) ?? null
}
export async function savePerson(p: Person): Promise<void> {
  await (await db()).put('people', p)
}
export async function deletePerson(id: string): Promise<void> {
  await (await db()).delete('people', id)
}

export const timeKnown = (p: Person) => p.hh !== null && p.mi !== null

export function birthInput(p: Person): BirthInput {
  const prov = provinceByName(p.province)
  if (!prov) throw new Error('ไม่พบจังหวัด ' + p.province)
  return { y: p.y, mo: p.mo, d: p.d, hh: p.hh ?? 12, mi: p.mi ?? 0, lat: latOf(prov), lon: lonOf(prov) }
}

export async function getNote(id: string): Promise<string> {
  return ((await (await db()).get('notes', id)) as { text: string } | undefined)?.text ?? ''
}
export async function saveNote(id: string, text: string): Promise<void> {
  const d = await db()
  if (text.trim()) await d.put('notes', { id, text })
  else await d.delete('notes', id)
}

/** สำรองข้อมูล: ทุกคน + โน้ต เป็น JSON */
export async function exportAll(): Promise<string> {
  const d = await db()
  return JSON.stringify({ app: 'astro', v: 2, people: await d.getAll('people'), notes: await d.getAll('notes') }, null, 1)
}
/** นำเข้า: รวมกับข้อมูลเดิม (id ซ้ำ = แทนที่) · คืนจำนวนคนที่นำเข้า */
export async function importAll(json: string): Promise<number> {
  const o = JSON.parse(json) as { app?: string; people?: Person[]; notes?: { id: string; text: string }[] }
  if (o.app !== 'astro' || !Array.isArray(o.people)) throw new Error('ไฟล์ไม่ใช่ข้อมูลสำรองของแอปนี้')
  const d = await db()
  const hasMe = (await listPeople()).some((p) => p.isMe)
  const tx = d.transaction(['people', 'notes'], 'readwrite')
  for (const p of o.people) {
    if (typeof p.id !== 'string' || typeof p.name !== 'string') continue
    // มีชาร์ตของฉันอยู่แล้ว และเป็นคนละ id → นำเข้าเป็นคนทั่วไป
    if (p.isMe && hasMe && !(await tx.objectStore('people').get(p.id))) p.isMe = false
    await tx.objectStore('people').put(p)
  }
  for (const n of o.notes ?? []) if (typeof n.id === 'string' && typeof n.text === 'string') await tx.objectStore('notes').put(n)
  await tx.done
  return o.people.length
}
