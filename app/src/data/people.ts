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
  updatedAt?: number
}

let dbP: Promise<IDBPDatabase> | null = null
function db() {
  dbP ??= openDB('astro', 3, {
    upgrade(d, old) {
      if (old < 1) d.createObjectStore('people', { keyPath: 'id' })
      // v2: โน้ตส่วนตัวต่อจุดในชาร์ต (หน้า Sheet) — id = personId:จุด
      if (old < 2) d.createObjectStore('notes', { keyPath: 'id' })
      // v3: หมวดความสัมพันธ์ที่ตั้งเอง (new-screens/AddCategory) — relation ของคน = 'c:<id>'
      if (old < 3) d.createObjectStore('cats', { keyPath: 'id' })
    },
    // แอปเวอร์ชันใหม่ต้องอัปเกรดฐานข้อมูล: ปิดการเชื่อมต่อเก่าไม่ให้ขวาง แล้วโหลดหน้าใหม่
    blocking(_cur, _next, e) {
      ;(e.target as IDBDatabase).close()
      dbP = null
      location.reload()
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
export const REL_LABEL: Record<string, string> = { me: 'ฉัน', none: 'ไม่ระบุ', family: 'ครอบครัว', friend: 'เพื่อน', lover: 'คนรัก', work: 'ที่ทำงาน' }
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

/** นำเข้าไฟล์สำรอง (JSON: [Person] หรือ { people: [Person] }) — คืนจำนวนคนที่นำเข้า */
export async function importBackup(json: string): Promise<number> {
  const raw = JSON.parse(json) as unknown
  const list = (Array.isArray(raw) ? raw : (raw as { people?: unknown[] }).people) ?? []
  let n = 0
  for (const x of list as Partial<Person>[]) {
    if (typeof x?.id !== 'string' || typeof x.name !== 'string' || typeof x.y !== 'number' || typeof x.mo !== 'number' || typeof x.d !== 'number' || typeof x.province !== 'string') continue
    await savePerson({ id: x.id, name: x.name, y: x.y, mo: x.mo, d: x.d, hh: x.hh ?? null, mi: x.mi ?? null, province: x.province, relation: x.relation ?? (x.isMe ? 'me' : 'friend'), note: x.note, isMe: !!x.isMe, createdAt: x.createdAt ?? Date.now() })
    n++
  }
  return n
}

/** หมวดความสัมพันธ์ที่ตั้งเอง */
export interface RelCat { id: string; name: string; icon: number; color: number; createdAt: number }
export const CAT_ICONS: [string, string][] = [["ครอบครัว", "M3 11 12 4l9 7M5 10v10h14V10"], ["เพื่อนสนิท", "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0"], ["หัวใจ", "M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z"], ["ดาว", "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.8 6.7 19.4l1.2-6L3.4 9.3l6-.7z"], ["งาน", "M3 7h18v13H3zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"], ["เรียน", "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5"], ["ลูก", "M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 21v-4a5 5 0 0 1 10 0v4"], ["สัตว์เลี้ยง", "M5 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM15 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM12 21c-4 0-6-2-6-4.5S9 11 12 11s6 3 6 5.5S16 21 12 21z"], ["ดนตรี", "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"], ["กีฬา", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"], ["ศิลปิน", "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.6 0-1.4 1-1.9 2.2-1.9H18a3 3 0 0 0 3-3C21 7 17 3 12 3z"], ["ลูกค้า", "M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"], ["คนดัง", "M4 18l2-10 6 5 6-5 2 10z"], ["เดินทาง", "M2 16l20-8-6 12-3-5zM13 15l3-7"], ["จันทร์", "M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"], ["อื่น ๆ", "M5 12h.01M12 12h.01M19 12h.01"]]
export const CAT_COLORS = ['#B9A6FF', '#7FE3C0', '#7FB8FF', '#FF9EC7', '#FFD27A', '#FFB08A']
export async function listCats(): Promise<RelCat[]> {
  return ((await (await db()).getAll('cats')) as RelCat[]).sort((a, b) => a.createdAt - b.createdAt)
}
export async function saveCat(c: RelCat): Promise<void> { await (await db()).put('cats', c) }
/** ลบหมวด: คนในหมวดย้ายไป "ไม่ระบุ" ข้อมูลเกิดไม่หาย */
export async function deleteCat(id: string): Promise<void> {
  for (const p of await listPeople()) if (p.relation === 'c:' + id) await savePerson({ ...p, relation: 'none' })
  await (await db()).delete('cats', id)
}
/** ป้ายและสีของความสัมพันธ์ (รวมหมวดที่ตั้งเอง) */
export function relLabel(rel: string, cats: RelCat[]): string {
  const c = rel.startsWith('c:') ? cats.find((x) => 'c:' + x.id === rel) : null
  return c ? c.name : REL_LABEL[rel] ?? 'ไม่ระบุ'
}
export function relAvatar(rel: string, cats: RelCat[]): string {
  const c = rel.startsWith('c:') ? cats.find((x) => 'c:' + x.id === rel) : null
  return c ? `linear-gradient(135deg,${CAT_COLORS[c.color]},#3B6BFF)` : REL_AVATAR[rel] ?? REL_AVATAR.friend!
}
