import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoredSession } from '../api'
import useProgress from '../hooks/useProgress'
import VideoCard from '../components/VideoCard'
import VideoModal from '../components/VideoModal'
import FileListItem from '../components/FileListItem'

const API_BASE = import.meta.env.VITE_AUTH_API ?? '/api'
const ADAPTIVE_RESULTS_STORAGE_KEY = 'evaluaAdaptiveResults'

/* ----------------------------- helpers ----------------------------- */
function relationToId(value) {
  if (!value) return null
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (typeof first === 'string') return first
    if (first && typeof first === 'object') return first.id || first.value || null
    return null
  }
  if (typeof value === 'object' && value !== null) return value.id || value.value || null
  if (typeof value === 'string') return value
  return null
}

function normalizeFolder(folder) {
  const parentId = relationToId(folder?.parent)
  const visibility = Array.isArray(folder?.visibility)
    ? relationToId(folder.visibility)
    : folder?.visibility ?? null
  const name = folder?.name || folder?.title || 'Untitled'
  return {
    ...folder,
    name,
    title: name,
    parent: parentId ?? null,
    visibility: visibility ?? null,
  }
}

function normalizeFile(file) {
  const folderId = relationToId(file?.folder)
  const prereqId = relationToId(file?.prereq)
  const visibility = Array.isArray(file?.visibility)
    ? relationToId(file.visibility)
    : file?.visibility ?? null
  return {
    ...file,
    folder: folderId ?? null,
    prereq: prereqId ?? null,
    visibility: visibility ?? null,
  }
}

function buildTree(folders) {
  const map = new Map()
  folders.forEach((f) => map.set(f.id, { ...f, children: [] }))
  map.forEach((f) => {
    if (f.parent && map.has(f.parent)) map.get(f.parent).children.push(f)
  })
  const roots = []
  map.forEach((f) => { if (!f.parent || !map.has(f.parent)) roots.push(f) })

  function sort(nodes) {
    nodes.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title || a.name || '').localeCompare(b.title || b.name || ''))
    nodes.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

function FolderNode({ node, depth, onSelect, selectedId }) {
  const isActive = node.id === selectedId
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0f1f] ${
          isActive
            ? 'bg-binavy text-white focus-visible:ring-bireg dark:bg-[#001c5e]'
            : 'text-slate-600 hover:bg-biwhite focus-visible:ring-binavy/40 dark:text-slate-300 dark:hover:bg-[#111a33] dark:focus-visible:ring-[#6a87ff]/60'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <span className="font-medium truncate">{node.title || node.name || 'Untitled folder'}</span>
        <span className="text-xs text-slate-400">{node.children.length}</span>
      </button>

      {node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* --------------------------- main component --------------------------- */
export default function StudentDashboard() {
  const navigate = useNavigate()
  const session = useMemo(() => getStoredSession(), [])
  const token = session?.token
  const studentId = session?.id || session?.email || 'student'
  const studentName = session?.name || ''

  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adaptiveResults, setAdaptiveResults] = useState([])

  const { progress, upsert } = useProgress(token, studentId)

  const tree = useMemo(() => buildTree(folders), [folders])
  const defaultFolderId = useMemo(() => {
    if (!folders.length) return null
    const roots = folders
      .filter(f => !f.parent)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title || a.name || '').localeCompare(b.title || b.name || ''))
    return roots[0]?.id ?? folders[0].id
  }, [folders])

  const childrenOf = useCallback(
    (id) => folders
      .filter(f => f.parent === id)
      .sort((a,b)=>(a.order??999)-(b.order??999) || (a.title||a.name||'').localeCompare(b.title||b.name||'')),
    [folders]
  )

  const fileCountOf = useCallback(
    (id) => files.filter(f => f.folder === id).length,
    [files]
  )

  const hasDescendantFiles = useCallback((id) => {
    const stack = [...childrenOf(id)]
    while (stack.length) {
      const n = stack.pop()
      if (fileCountOf(n.id) > 0) return true
      stack.push(...childrenOf(n.id))
    }
    return false
  }, [childrenOf, fileCountOf])

  const filteredFiles = useMemo(() => {
    if (!selectedFolderId) return []
    return files
      .filter((f) => f.folder === selectedFolderId)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title || '').localeCompare(b.title || ''))
  }, [files, selectedFolderId])

  // load data
  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    let active = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const r = await fetch(`${API_BASE}/content/tree`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const payload = await r.json().catch(() => ({}))
        if (!r.ok) {
          setError(payload?.error || 'Unable to retrieve the content.')
          setFolders([]); setFiles([])
          return
        }
        if (!active) return
        const rawFolders = Array.isArray(payload?.folders) ? payload.folders : []
        const rawFiles = Array.isArray(payload?.files) ? payload.files : []
        const normalizedFolders = rawFolders
          .map(normalizeFolder)
          .filter((f) => !f.visibility || f.visibility === 'student')

        const folderIdSet = new Set(normalizedFolders.map((f) => f.id))
        const normalizedFiles = rawFiles
          .map(normalizeFile)
          .filter((f) => f.folder && folderIdSet.has(f.folder))

        setFolders(normalizedFolders)
        setFiles(normalizedFiles)
      } catch {
        if (active) {
          setError('Connection unavailable. Try again later.')
          setFolders([]); setFiles([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [navigate, token])

  // select default folder
  useEffect(() => {
    if (!folders.length) { setSelectedFolderId(null); return }
    setSelectedFolderId(prev => {
      if (prev && folders.some(f => f.id === prev)) return prev
      const root = folders.filter(f => !f.parent).sort((a,b) => (a.order ?? 999) - (b.order ?? 999))[0]
      return root?.id ?? folders[0].id
    })
  }, [folders])

  // auto-open first subfolder with content
  useEffect(() => {
    if (!selectedFolderId) return
    if (filteredFiles.length > 0) return
    const kids = childrenOf(selectedFolderId)
    const target = kids.find(k => fileCountOf(k.id) > 0) || kids.find(k => hasDescendantFiles(k.id))
    if (target) setSelectedFolderId(target.id)
  }, [selectedFolderId, filteredFiles.length, childrenOf, fileCountOf, hasDescendantFiles])

  // propedeuticity
  const isLocked = useCallback((file, list) => {
    if (file.prereq) {
      const pre = progress[file.prereq]
      return !(pre && pre.completed)
    }
    const sorted = list.filter(f => f.type === 'video')
      .sort((a,b) => (a.order ?? 999) - (b.order ?? 999))
    const idx = sorted.findIndex(f => f.id === file.id)
    if (idx <= 0) return false
    const prev = sorted[idx - 1]
    return !progress[prev.id]?.completed
  }, [progress])

  const [playing, setPlaying] = useState(null)
  const handleOpenVideo = (file) => setPlaying(file)
  const handleCloseVideo = () => setPlaying(null)

  // ✅ callback stabili: evitano re-render del modal/player
  const handleProgress = useCallback((fileId, seconds) => {
    upsert(fileId, { seconds })
  }, [upsert])

  const handleComplete = useCallback((fileId) => {
    upsert(fileId, { completed: true })
  }, [upsert])

  const handleGoToDefaultFolder = useCallback(() => {
    if (defaultFolderId) setSelectedFolderId(defaultFolderId)
  }, [defaultFolderId])

  const latestAdaptiveResult = useMemo(() => adaptiveResults[0] || null, [adaptiveResults])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const loadResults = () => {
      try {
        const raw = window.localStorage.getItem(ADAPTIVE_RESULTS_STORAGE_KEY)
        if (!raw) { setAdaptiveResults([]); return }
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) { setAdaptiveResults([]); return }
        const normalized = parsed
          .map((entry, index) => {
            const startedAt = entry?.startedAt || null
            const completedAt = entry?.completedAt || null
            return {
              id: entry?.id || `${startedAt || 'attempt'}-${index}`,
              estimatedLevel: entry?.estimatedLevel || null,
              confidence: typeof entry?.confidence === 'number' ? entry.confidence : null,
              totalItems: typeof entry?.totalItems === 'number' ? entry.totalItems : null,
              durationSec: typeof entry?.durationSec === 'number' ? entry.durationSec : null,
              askedByLevel: typeof entry?.askedByLevel === 'object' && entry?.askedByLevel !== null
                ? entry.askedByLevel
                : {},
              startedAt,
              completedAt,
            }
          })
          .sort((a, b) => {
            const aTime = new Date(a.completedAt || a.startedAt || 0).getTime()
            const bTime = new Date(b.completedAt || b.startedAt || 0).getTime()
            return bTime - aTime
          })
        setAdaptiveResults(normalized)
      } catch {
        setAdaptiveResults([])
      }
    }

    loadResults()

    const handleStorage = (event) => {
      if (event.key === ADAPTIVE_RESULTS_STORAGE_KEY) loadResults()
    }
    const handleCustom = () => loadResults()

    window.addEventListener('storage', handleStorage)
    window.addEventListener('evalua:adaptive-result-saved', handleCustom)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('evalua:adaptive-result-saved', handleCustom)
    }
  }, [])

  const formatDateTime = useCallback((value) => {
    if (!value) return '—'
    try {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return '—'
      return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    } catch {
      return '—'
    }
  }, [])

  const formatConfidence = useCallback((confidence) => {
    if (typeof confidence !== 'number') return '—'
    return `${Math.round(confidence * 100)}%`
  }, [])

  const formatDuration = useCallback((seconds) => {
    if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '—'
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    const minLabel = minutes ? `${minutes}m` : ''
    const secLabel = `${remaining}s`
    return `${minLabel}${minLabel ? ' ' : ''}${secLabel}`.trim()
  }, [])

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-b from-biwhite via-biwhite to-binavy/10 dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#001c5e]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <h1 className="text-3xl font-semibold text-binavy dark:text-white">Student area</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {studentName ? `Hi ${studentName}, welcome to your learning environment` : 'Explore your learning contents.'}
          </p>
          <div className="mt-3 text-sm">
            <Link to="/logout" className="font-semibold underline-offset-4 text-binavy hover:text-bireg dark:text-white">Logout</Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="px-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Learning Hub</h2>
            <div className="mt-2 space-y-1">
              {tree.length ? (
                tree.map((node) => (
                  <FolderNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onSelect={setSelectedFolderId}
                    selectedId={selectedFolderId}
                  />
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-slate-500">No folders available.</p>
              )}
            </div>
          </aside>

          {/* Main content */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My courses</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Access the learning folders assigned to your profile and resume your progress where you left off.
                </p>
                <button
                  type="button"
                  onClick={handleGoToDefaultFolder}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-binavy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#001c5e] focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-[#16348f] dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!defaultFolderId}
                >
                  Explore content
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Results</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {latestAdaptiveResult
                    ? `Latest: ${latestAdaptiveResult.estimatedLevel || '—'} • ${formatConfidence(latestAdaptiveResult.confidence)} on ${formatDateTime(latestAdaptiveResult.completedAt || latestAdaptiveResult.startedAt)}`
                    : 'Review your adaptive test attempts and keep track of your certification readiness.'}
                </p>
                <a
                  href="#my-results"
                  className="mt-4 inline-block w-full rounded-xl bg-slate-900 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:opacity-90 dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f]"
                >
                  View history
                </a>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Adaptive Test</h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-slate-300">
                  Take the official <strong>QUAET</strong> Adaptive English Test to assess your current level.
                </p>
                <a
                  href="/adaptive-test"
                  className="inline-block w-full rounded-xl bg-black px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-bireg focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-slate-900 dark:hover:opacity-90 dark:focus-visible:ring-[#6a87ff] dark:focus-visible:ring-offset-[#0a0f1f]"
                >
                  Start QUAET Test
                </a>
              </div>
            </div>

            {error && !loading && (
              <div className="rounded-xl border border-bireg/30 bg-bireg/10 p-3 text-sm text-bireg">{error}</div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[16/9] animate-pulse rounded-2xl bg-slate-200/50 dark:bg-white/10" />
                ))}
              </div>
            ) : !selectedFolderId ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">Select a folder to view content.</p>
            ) : filteredFiles.length === 0 ? (
              (() => {
                const subs = childrenOf(selectedFolderId)
                if (subs.length === 0) {
                  return <p className="text-sm text-slate-600 dark:text-slate-300">This section is empty.</p>
                }
                return (
                  <div>
                    <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                      Select a subsection:
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {subs.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedFolderId(s.id)}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/70"
                        >
                          <span className="font-medium truncate">{s.title || s.name || 'Untitled'}</span>
                          <span className="ml-3 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            {fileCountOf(s.id)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()
            ) : (
              <>
                {filteredFiles.some(f => f.type === 'video') ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {filteredFiles.filter(f => f.type === 'video').map(file => {
                      const prog = progress[file.id]
                      const pct = file.duration
                        ? Math.min(100, Math.round(((prog?.seconds || 0) / file.duration) * 100))
                        : (prog?.completed ? 100 : 0)
                      const locked = isLocked(file, filteredFiles)
                      return (
                        <VideoCard
                          key={file.id}
                          file={file}
                          locked={locked}
                          progressPct={pct}
                          onClick={() => handleOpenVideo(file)}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {filteredFiles.map(file => (
                      <FileListItem
                        key={file.id}
                        file={file}
                        onOpen={() => window.open(file.url, '_blank', 'noopener')}
                        onCopy={async () => navigator.clipboard?.writeText(file.url)}
                        isCopied={false}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>

        <div
          id="my-results"
          className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
        >
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">My Results</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Track the outcomes of your adaptive assessments and monitor your progress toward certification.
          </p>

          {adaptiveResults.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-[#111a33] dark:text-slate-300">
              No adaptive test results available yet. Launch your first attempt with the QUAET Adaptive Test above.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <th className="px-3 py-2 font-semibold">Completed</th>
                    <th className="px-3 py-2 font-semibold">Estimated level</th>
                    <th className="px-3 py-2 font-semibold">Confidence</th>
                    <th className="px-3 py-2 font-semibold">Items</th>
                    <th className="px-3 py-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {adaptiveResults.map((attempt) => (
                    <tr key={attempt.id} className="border-b border-slate-100 last:border-none dark:border-slate-800">
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {formatDateTime(attempt.completedAt || attempt.startedAt)}
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {attempt.estimatedLevel || '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {formatConfidence(attempt.confidence)}
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {typeof attempt.totalItems === 'number' ? attempt.totalItems : '—'}
                      </td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {formatDuration(attempt.durationSec)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Video modal */}
      <VideoModal
        open={!!playing}
        file={playing}
        onClose={handleCloseVideo}
        onProgress={handleProgress}
        onComplete={handleComplete}
      />
    </div>
  )
}
