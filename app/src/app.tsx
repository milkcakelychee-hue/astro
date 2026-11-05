// ตัวนำทางแบบ hash (#/main, #/people …) — หน้าจริงเพิ่มทีละหน้าในขั้น E
import { useEffect, useState } from 'preact/hooks'
import { DesignPreview } from './pages/DesignPreview.tsx'
import { Main } from './pages/Main.tsx'

function useHash() {
  const [h, setH] = useState(location.hash)
  useEffect(() => {
    const on = () => {
      setH(location.hash)
      scrollTo(0, 0)
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
      return <Main />
    case 'design':
      return <DesignPreview />
    default:
      // หน้าที่ยังไม่ได้ทำ
      return <Main />
  }
}
