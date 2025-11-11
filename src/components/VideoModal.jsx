import React, { useEffect, useRef } from 'react'
import Player from '@vimeo/player'

export default function VideoModal({ open, file, onClose, onProgress, onComplete }) {
  const iframeRef = useRef(null)
  const playerRef = useRef(null)
  const lastSentRef = useRef(0)

  useEffect(() => {
    if (!open || !file) return
    const iframe = iframeRef.current
    if (!iframe) return

    const player = new Player(iframe)
    playerRef.current = player

    const handleTime = (data) => {
      const seconds = Math.floor(data?.seconds || 0)
      // throttle: invia max 1 volta al secondo
      if (seconds !== lastSentRef.current) {
        lastSentRef.current = seconds
        onProgress?.(file.id, seconds)
      }
      if (file.duration && seconds >= Math.max(15, file.duration * 0.9)) {
        onComplete?.(file.id)
      }
    }
    const handleEnded = () => onComplete?.(file.id)

    player.on('timeupdate', handleTime)
    player.on('ended', handleEnded)

    return () => {
      player.off('timeupdate', handleTime)
      player.off('ended', handleEnded)
      player.unload().catch(() => {})
      playerRef.current = null
      lastSentRef.current = 0
    }
  // 👉 ricrea il player solo quando cambia l’apertura o l’ID del file
  }, [open, file?.id])

  if (!open || !file) return null

  // Aggiunge autopause=0 senza rompere eventuali query esistenti
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
