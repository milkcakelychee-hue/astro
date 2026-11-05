// กฎตัดบรรทัดกลางของทั้งแอป (ผู้ใช้ขอ) — ทำงานกับทุกข้อความที่แสดง ไม่ต้องแก้ทีละหน้า
// 1) คำอังกฤษในวงเล็บเป็นก้อนเดียว เช่น "(Personal calendar)" — ยาวมากตัดได้เฉพาะหลังจุลภาค
// 2) วันที่ไทยไม่แยก เช่น "21 พ.ค. 2572", "พ.ศ. 2569", "5 พฤศจิกายน"
// (หัวข้อใช้ text-wrap: balance, ย่อหน้าใช้ pretty — ดู index.css)
const NB = ' '
const MON = 'ม\\.ค\\.|ก\\.พ\\.|มี\\.ค\\.|เม\\.ย\\.|พ\\.ค\\.|มิ\\.ย\\.|ก\\.ค\\.|ส\\.ค\\.|ก\\.ย\\.|ต\\.ค\\.|พ\\.ย\\.|ธ\\.ค\\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม'
const RE_PAREN = /\([A-Za-z0-9][^()ก-๙]*\)/g
const RE_DATE = new RegExp(`(\\d{1,2}) (${MON})(?: (\\d{4}))?|(พ\\.ศ\\.|ค\\.ศ\\.) (\\d{4})`, 'g')

export function fixText(s: string): string {
  if (!s.includes(' ')) return s
  return s
    .replace(RE_PAREN, (m) => m.replace(/(,) /g, '$1\u0001').replace(/ /g, NB).replace(/\u0001/g, ' '))
    .replace(RE_DATE, (m) => m.replace(/ /g, NB))
}

function walk(root: Node) {
  if (root.nodeType === 3) {
    const t = root as Text
    const f = fixText(t.data)
    if (f !== t.data) t.data = f
    return
  }
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n: Node | null
  while ((n = tw.nextNode())) {
    const t = n as Text
    // ไม่ยุ่งกับช่องพิมพ์
    if (t.parentElement?.closest('textarea,input,[contenteditable]')) continue
    const f = fixText(t.data)
    if (f !== t.data) t.data = f
  }
}

export function installLineBreakRules() {
  walk(document.body)
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'characterData') walk(m.target)
      else m.addedNodes.forEach(walk)
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true })
}
