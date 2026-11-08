// แสดงข้อความคลังที่มีตัวหนาแบบ **คำ** (ใช้กับหมวด transit_story)
import { text, type InterpLib } from '../lib/interp.ts'

export function Rich(props: { s: string }) {
  return <>{props.s.split(/\*\*(.+?)\*\*/).map((x, i) => (i % 2 ? <b style={{ color: 'var(--rich-b, #F2F4FA)', fontWeight: 600 }}>{x}</b> : x))}</>
}
/** ข้อความทรานซิต 3 บรรทัด: [ดาวจรนำอะไรมา, มาแตะเรื่องไหน เกิดอะไร, 💡 ควรทำ · ระยะผล] */
export function transitStory(lib: InterpLib, key: string): [string, string, string] | null {
  const s = text(lib, 'transit_story', key)
  if (!s) return null
  const [a = '', b = '', c = ''] = s.split('\n')
  return [a, b, c]
}
/** ตัดตัวหนาออก (ใช้ตอนต้องการข้อความล้วน) */
export const plain = (s: string) => s.replace(/\*\*/g, '')
