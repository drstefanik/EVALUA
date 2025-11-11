import React, { useEffect, useRef } from 'react'
import Player from '@vimeo/player'

export default function VideoModal({ open, file, onClose, onProgress, onComplete }) {
  const iframeRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    if (!open || !file) return
    const iframe = iframeRef.current
    if (!iframe) return
    const player = new Player(iframe)
    playerRef.current = player

    player.on('timeupdate', (data) => {
      onProgress?.(file.id, Math.floor(data.seconds))
      if (file.duration && data.seconds >= Math.max(15, file.duration * 0.9)) {
        onComplete?.(file.id)
      }
    })
    player.on('ended', () => onComplete?.(file.id))

    return () => {
      player.off('timeupdate')
      player.off('ended')
      player.unload().catch(() => {})
      playerRef.current = null
    }
  }, [open, file, onProgress, onComplete])

  if (!open || !file) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 px-4 py-8" onClick={onClose}>
      <div className="mx-auto max-w-5xl rounded-2xl bg-black" onClick={(e)=>e.stopPropagation()}>
        <div className="aspect-[16/9] w-full">
          <iframe
            ref={iframeRef}
            src={file.url}
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
