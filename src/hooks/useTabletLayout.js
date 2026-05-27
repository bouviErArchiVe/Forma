import { useState, useEffect } from 'react'
import { isTabletLayout } from '@/lib/layout'

export function useTabletLayout() {
  const [tablet, setTablet] = useState(() => isTabletLayout())

  useEffect(() => {
    const sync = () => setTablet(isTabletLayout())
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  return tablet
}
