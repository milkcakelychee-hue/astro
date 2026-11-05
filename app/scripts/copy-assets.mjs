// คัดลอกไฟล์ที่ต้องเสิร์ฟแบบ static เข้า public/ (รันอัตโนมัติก่อน dev/build)
// - engine/ephe/*.se1 → public/ephe/
// - swisseph-wasm/wasm/{wasm,data} → public/wasm/ (โมดูลหาไฟล์ที่ ../wasm/ จากตำแหน่ง chunk)
import { cpSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(app, 'public')
mkdirSync(join(pub, 'ephe'), { recursive: true })
mkdirSync(join(pub, 'wasm'), { recursive: true })
cpSync(join(app, '../engine/ephe'), join(pub, 'ephe'), { recursive: true })
for (const f of ['swisseph.wasm', 'swisseph.data']) {
  cpSync(join(app, 'node_modules/swisseph-wasm/wasm', f), join(pub, 'wasm', f))
}
console.log('copied ephe + wasm → public/')
