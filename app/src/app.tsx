// ตัวนำทางแบบ hash (#/main, #/people …) — หน้าจริงเพิ่มทีละหน้าในขั้น E
import { useEffect, useState } from 'preact/hooks'
import { AddPerson } from './pages/AddPerson.tsx'
import { Aspects } from './pages/Aspects.tsx'
import { DesignPreview } from './pages/DesignPreview.tsx'
import { Main } from './pages/Main.tsx'
import { Today } from './pages/Today.tsx'
import { People } from './pages/People.tsx'
import { Compare } from './pages/Compare.tsx'
import { Forecast } from './pages/Forecast.tsx'
import { Settings } from './pages/Settings.tsx'
import { Calendar } from './pages/Calendar.tsx'
import { Timeline } from './pages/Timeline.tsx'
import { Transit } from './pages/Transit.tsx'
import { Lunations } from './pages/Lunations.tsx'
import { SolarReturn } from './pages/SolarReturn.tsx'
import { VenusRose } from './pages/VenusRose.tsx'
import { Eclipses } from './pages/Eclipses.tsx'
import { MoonPhases } from './pages/MoonPhases.tsx'
import { Retrograde } from './pages/Retrograde.tsx'
import { Growth } from './pages/Growth.tsx'
import { LunarReturn } from './pages/LunarReturn.tsx'
import { ComingSoon } from './pages/ComingSoon.tsx'

function useHash() {
  const [h, setH] = useState(location.hash)
  useEffect(() => {
    let prev = location.hash.split('?')[0]
    const on = () => {
      setH(location.hash)
      // เปลี่ยนแค่ query (เช่นเปิด Sheet) ไม่ต้องเลื่อนขึ้นบนสุด
      const base = location.hash.split('?')[0]
      if (base !== prev) scrollTo(0, 0)
      prev = base
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return h.replace(/^#\/?/, '').split('?')[0]!
}

export function App() {
  const route = useHash()
  switch (route) {
    case '':
    case 'main':
      // key: สลับคน (?id=) ต้องโหลดใหม่
      return <Main key={new URLSearchParams(location.hash.split('?')[1] ?? '').get('id') ?? 'me'} />
    case 'add':
      return <AddPerson key={location.hash} />
    case 'aspects':
      return <Aspects />
    case 'people': {
      const id = new URLSearchParams(location.hash.split('?')[1] ?? '').get('id')
      // แตะชื่อคน → ชาร์ตของคนนั้น อยู่ในแท็บบุคคล (ผู้ใช้ขอ)
      return id ? <Main key={id} tab="people" /> : <People />
    }
    case 'compare':
      return <Compare key={location.hash} />
    case 'calendar':
      return <Calendar />
    case 'solar-return':
      return <SolarReturn />
    case 'venus-rose':
      return <VenusRose />
    case 'eclipses':
      return <Eclipses />
    case 'moon-phases':
      return <MoonPhases />
    case 'retrograde':
      return <Retrograde />
    case 'growth':
      return <Growth />
    case 'lunar-return':
      return <LunarReturn />
    case 'lunations':
      return <Lunations />
    case 'transit':
      return <Transit />
    case 'timeline':
      return <Timeline />
    case 'settings':
      return <Settings />
    case 'forecast':
      return <Forecast />
    case 'today':
      return <Today />
    case 'design':
      return <DesignPreview />
    default:
      // หน้าที่ยังไม่ได้ทำ
      return <ComingSoon route={route} />
  }
}
