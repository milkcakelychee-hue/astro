// ชั่วคราว: หน้าตรวจระบบ (wasm + ephemeris + คลัง) — จะแทนด้วยหน้าจริงตามดีไซน์ในขั้น E
import { useEffect, useState } from 'preact/hooks'
import { computeChart, floorMin } from './engine/chart.ts'
import { getBrowserSwe } from './engine/ephe-browser.ts'
import { loadLib, text } from './lib/interp.ts'

export function App() {
  const [msg, setMsg] = useState('กำลังโหลด…')
  useEffect(() => {
    Promise.all([getBrowserSwe(), loadLib()])
      .then(([swe, lib]) => {
        const ch = computeChart(swe, { y: 1999, mo: 8, d: 5, hh: 20, mi: 33, lat: 13 + 7 / 60, lon: 99 + 57 / 60 })
        const m = floorMin(ch.pos.c.lon)
        setMsg(`ok chiron=${Math.floor(m / 60)}°${m % 60} lib=${text(lib, 'aspect', 'Sqa')?.slice(0, 16)}`)
      })
      .catch((e: unknown) => setMsg('error ' + String(e)))
  }, [])
  return <div id="smoke" style={{ color: '#fff', padding: 16 }}>{msg}</div>
}
