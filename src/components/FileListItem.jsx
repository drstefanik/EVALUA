import React from 'react'
import { formatBytes } from '../utils/format'

const ICONS = {
  pdf: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-rose-500" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V9.414a2.5 2.5 0 0 0-.732-1.768l-4.414-4.414A2.5 2.5 0 0 0 13.586 2H6.5Zm0 1.5h7V8a1 1 0 0 0 1 1h4.5v10.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V3.5Zm8 .914 3.586 3.586H15.5a.5.5 0 0 1-.5-.5V4.414ZM8 12a1 1 0 0 1 1-1h1.25a2.25 2.25 0 1 1 0 4.5H9v1.25a.75.75 0 0 1-1.5 0V12Zm2.25 1.5a.75.75 0 0 0 0-1.5H9v1.5h1.25Zm3-2.5h1.75a1.75 1.75 0 1 1 0 3.5H13.5v1.25a.75.75 0 0 1-1.5 0V11a1 1 0 0 1 1-1Zm1.75 2a.25.25 0 1 0 0-1h-1v1h1Z"
      />
    </svg>
  ),
  mp3: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 3a1 1 0 0 0-1 1v12.268A2.25 2.25 0 1 0 8.5 18V8.75h8V15.5a2.25 2.25 0 1 0 1.5 2.118V4a1 1 0 0 0-1-1H8Zm8 3.75h-8V4h8v2.75Z"
      />
    </svg>
  ),
  zip: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 2.5A2.5 2.5 0 0 0 5.5 5v14A2.5 2.5 0 0 0 8 21.5h8A2.5 2.5 0 0 0 18.5 19V8.914a2.5 2.5 0 0 0-.732-1.768l-4.914-4.914A2.5 2.5 0 0 0 11.086 2.5H8Zm0 1.5h3.086a1 1 0 0 1 .707.293l4.914 4.914a1 1 0 0 1 .293.707V19a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V4Zm2 2a.75.75 0 0 0 0 1.5h.5V9h-1a.75.75 0 0 0 0 1.5h1v1.5h-1A.75.75 0 0 0 10 13.5h1v2a.75.75 0 0 0 1.5 0v-2h1a.75.75 0 0 0 0-1.5h-1V10.5h1A.75.75 0 0 0 12.5 9h-1V7.5h.5a.75.75 0 0 0 0-1.5h-1Z"
      />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-sky-500" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.828 4.586a4 4 0 0 1 5.656 5.656l-2.828 2.829a4 4 0 0 1-5.657 0 1 1 0 0 1 1.414-1.415 2 2 0 0 0 2.829 0l2.828-2.828a2 2 0 1 0-2.828-2.828l-1.061 1.06a1 1 0 1 1-1.414-1.414l1.061-1.06ZM10 7a4 4 0 0 1 2.829 1.172 1 1 0 0 1-1.415 1.415A2 2 0 0 0 10 9H7a2 2 0 0 0-1.414 3.414l1.757 1.757a1 1 0 1 1-1.414 1.414L4.172 13.5a4 4 0 0 1 2.828-6.829H10Zm4 3a1 1 0 0 1 0 2h-4a1 1 0 1 1 0-2h4Zm-3 3a1 1 0 0 1 0 2H7a4 4 0 0 1-2.829-6.828L4.172 7.5a1 1 0 0 1 1.414 1.414L4.828 9.672A2 2 0 0 0 7 13h4Z"
      />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-500" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.414a2 2 0 0 0-.586-1.414l-4.414-4.414A2 2 0 0 0 12.586 3H7Zm0 2h5.586L17 9.414V19H7V5Zm2.75 6A2.25 2.25 0 0 0 7.5 13.25v.5A2.25 2.25 0 0 0 9.75 16h.5A2.25 2.25 0 0 0 12.5 13.75v-.5A2.25 2.25 0 0 0 10.25 11h-.5Zm0 1.5h.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-.5a.75.75 0 0 1 .75-.75Zm4.5-1.5a.75.75 0 0 0 0 1.5h1a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-1a.75.75 0 0 0 0 1.5h1A2.25 2.25 0 0 0 17 14.75v-.5A2.25 2.25 0 0 0 14.75 12h-1Z"
      />
    </svg>
  ),
  ppt: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 2A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V9.414a2.5 2.5 0 0 0-.732-1.768l-4.414-4.414A2.5 2.5 0 0 0 13.586 2H6.5Zm0 1.5h7V8a1 1 0 0 0 1 1h4.5v10.5a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V3.5Zm3.75 6.75a2.25 2.25 0 1 0 0 4.5h1.25v1.25a.75.75 0 0 0 1.5 0V10a.75.75 0 0 0-.75-.75h-2Zm.75 1.5h.5v1.5h-.5a.75.75 0 1 1 0-1.5Z"
      />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9.414a2 2 0 0 0-.586-1.414l-4.414-4.414A2 2 0 0 0 13.586 3H6Zm0 2h7v3.5A1.5 1.5 0 0 0 14.5 10H18v9H6V5Z"
      />
    </svg>
  ),
}

export function getFileIcon(type) {
  if (!type) return ICONS.default
  const key = String(type).toLowerCase()
  if (ICONS[key]) return ICONS[key]
  if (key.includes('ppt')) return ICONS.ppt
  if (key.includes('doc')) return ICONS.doc
  if (key.includes('pdf')) return ICONS.pdf
  if (key.includes('zip')) return ICONS.zip
  if (key.includes('mp3') || key.includes('audio')) return ICONS.mp3
  if (key.includes('link') || key.includes('http')) return ICONS.link
  return ICONS.default
}

export default function FileListItem({ file, onOpen, onCopy, isCopied }) {
  const title = file?.title || 'Untitled file'
  const icon = getFileIcon(file?.type)
  const hasUrl = Boolean(file?.url)
  const hasSize = Number.isFinite(Number(file?.size)) && Number(file.size) > 0
  const sizeLabel = hasSize ? formatBytes(file.size) : null

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100" aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900" title={title}>
            {title}
          </p>
          {sizeLabel && (
            <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {sizeLabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={hasUrl ? onOpen : undefined}
          disabled={!hasUrl}
          aria-label={`Open ${title}`}
          className="inline-flex items-center justify-center rounded-lg bg-binavy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Open
        </button>
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy link for ${title}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-binavy focus:ring-offset-2"
        >
          {isCopied ? 'Copied!' : 'Copy link'}
        </button>
      </div>
    </li>
  )
}
