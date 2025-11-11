import React, { useEffect, useRef } from 'react'
import Player from '@vimeo/player'

export default function VideoModal({ open, file, onClose, onProgress, onComplete }) {
  const iframeRef = useRef(null)
  const playerRef = useRef(null)

  const lastSentRef = useRef(0)          // throttle progress (1s)
  const durationRef = useRef(null)       // durata in secondi
  const completedSentRef = useRef(false) // evita onComplete multipli

  useEffect(() => {
    if (!open || !file) return
    const iframe = iframeRef.current
    if (!iframe) return

    const player = new Player(iframe)
    playerRef.current = player
    completedSentRef.current = false
    lastSentRef.current = 0

    // inizializza durata (preferisci quella passata dal backend, fallback a getDuration)
    if (typeof file.duration === 'number' && file.duration > 0) {
      durationRef.current = file.duration
    } else {
      player.getDuration().then((d) => {
        if (typeof d === 'number' && d > 0) durationRef.current = d
      }).catch(() => {})
    }

    const handleTime = (data) => {
      const seconds = Math.floor(data?.seconds || 0)

      // throttle progress: invia max 1 volta al secondo
      if (seconds !== lastSentRef.current) {
        lastSentRef.current = seconds
        onProgress?.(file.id, seconds)
      }

      // completamento al 60% (una sola volta)
      const duration = durationRef.current
      if (!completedSentRef.current && duration && duration > 0) {
        const ratio = seconds / duration
        if (ratio >= 0.6) {
          completedSentRef.current = true
          onComplete?.(file.id)
        }
      }
    }

    const handleEnded = () => {
      if (!completedSentRef.current) {
        completedSentRef.current = true
        onComplete?.(file.id)
      }
    }

    player.on('timeupdate', handleTime)
    player.on('ended', handleEnded)

    return () => {
      player.off('timeupdate', handleTime)
      player.off('ended', handleEnded)
      player.unload().catch(() => {})
      playerRef.current = null
      lastSentRef.current = 0
      durationRef.current = null
      completedSentRef.current = false
    }
  // ricrea il player solo quando cambia apertura o ID del file
  }, [open, file?.id])

  if (!open || !file) return null

  // evita autopause tra eventuali istanze
  const src = file.url?.includes('?') ? `${file.url}&autopause=0` : `${file.url}?autopause=0`

  return (
    <div className="fixed inset-0 z-50 bg-black/70 px-4 py-8" onClick={onClose}>
      <div className="mx-auto max-w-5xl rounded-2xl bg-black" onClick={(e)=>e.stopPropagation()}>
        <div className="aspect-[16/9] w-full">
          <iframe
            ref={iframeRef}
            src={src}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full rounded-2xl"
            title={file.title}
          />
        </div>
        <div className="flex items-center justify-between p-3 text-white text-sm">
          <span>{file.title}</span>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20">Close</button>
        </div>
      </div>
    </div>
  )
}
