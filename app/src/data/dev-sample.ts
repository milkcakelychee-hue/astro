// ใช้เฉพาะตอนพัฒนา (import.meta.env.DEV) — ข้อมูลทดสอบจาก docs/02 ไม่อยู่ใน build จริง
import { savePerson } from './people.ts'

export async function loadDevSample() {
  await savePerson({
    id: 'dev-sample', name: 'ตัวอย่าง', y: 1999, mo: 8, d: 5, hh: 20, mi: 33,
    province: 'Phetchaburi', relation: 'self', isMe: true, createdAt: Date.now(),
  })
}
