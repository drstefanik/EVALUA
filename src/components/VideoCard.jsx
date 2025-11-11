import React from 'react'

export default function VideoCard({ file, locked, progressPct, onClick }) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900 ${
        locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <div className="aspect-[16/9] w-full bg-slate-100 dark:bg-slate-800">
        {file.thumb ? (
          <img src={file.thumb} alt={file.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">No cover</div>
        )}
        {!locked && progressPct > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-binavy" style={{ width: `${progressPct}%` }} />
        )}
        {locked && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm font-semibold">
            Locked — complete previous
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{file.title}</div>
        {file.duration ? (
          <div className="mt-1 text-xs text-slate-500">{Math.round(file.duration/60)} min</div>
        ) : null}
      </div>
    </button>
  )
}
