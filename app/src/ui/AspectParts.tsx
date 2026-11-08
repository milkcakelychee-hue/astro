// ผู้ใช้ขอ (6 พ.ย. 2569): คำอธิบายมุมดาวแบบเป็นโครงสร้าง แทนย่อหน้ายาว — 🎯 แก่นเรื่อง ⚡ พลังทำงานแบบ ✅ ด้านดี ⚠️ ระวัง
import { parseAspect } from '../pages/PlanetSheet.tsx'
import { Rich } from './rich.tsx'

type Part = 'theme' | 'how' | 'good' | 'warn'
const ROWS: [Part, string, string, string][] = [['theme', '🎯', 'แก่นเรื่อง', '#B9A6FF'], ['how', '⚡', 'พลังทำงานแบบ', '#7FB8FF'], ['good', '✅', 'ด้านดี', '#7FE3C0'], ['warn', '⚠️', 'ระวัง', '#FFB08A']]

/** ข้อความคลังหมวด aspect → แถวมีอิโมจิ · skip = ส่วนที่แสดงที่อื่นแล้ว */
export function AspectParts(props: { text: string | null; skip?: Part[]; story?: string | null }) {
  // ผู้ใช้ขอ (8 พ.ย. 2569): ข้อความแบบเล่าเรื่อง (aspect_story) · ย่อ = เฉพาะบรรทัดที่ 2
  if (props.story) {
    const ls = props.story.split('\n')
    const show = props.skip?.length ? [ls[1] ?? ''] : ls
    return <span style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', lineHeight: 1.6, textAlign: 'left', color: '#E6E9F2' }}>{show.map((l) => <span><Rich s={l} /></span>)}</span>
  }
  const pa = parseAspect(props.text)
  if (!pa) return null
  const rows = ROWS.filter(([k]) => pa[k] && !props.skip?.includes(k))
  return (
    <span style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr)', gap: '8px', fontSize: '13px', lineHeight: 1.55, textAlign: 'left' }}>
      {rows.map(([k, e, l, c]) => <><span aria-hidden="true">{e}</span><span style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontSize: '12px', color: c }}>{l}</span><span style={{ color: '#E6E9F2' }}>{pa[k]}</span></span></>)}
    </span>
  )
}
