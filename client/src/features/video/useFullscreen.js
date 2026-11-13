import { useEffect, useState } from 'react'
import { useClient } from '@/state/provider'
// fullscreen on `target`; while fullscreen the keyboard lock lets Esc/Alt+Tab etc. reach the remote
export function useFullscreen(target) {
  const client = useClient()
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const onFs = () => {
      const fs = !!document.fullscreenElement
      setFullscreen(fs)
      const kb = navigator.keyboard
      fs ? kb?.lock?.().catch(() => {}) : kb?.unlock?.()
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])
  const request = () => {
    // iOS only allows fullscreen on the video element itself
    if (target.current?.requestFullscreen) target.current.requestFullscreen().catch(() => {})
    else client.transport.element?.webkitEnterFullscreen?.()
  }
  return { fullscreen, request }
}
