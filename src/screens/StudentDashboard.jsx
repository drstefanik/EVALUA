import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoredSession } from '../api'
import useProgress from '../hooks/useProgress'
import { useCurrentUser } from '../hooks/useCurrentUser.js'
import VideoCard from '../components/VideoCard'
import VideoModal from '../components/VideoModal'
import FileListItem from '../components/FileListItem'
import DashboardCards from '../components/DashboardCards.jsx'
import FeatureGate from '../components/FeatureGate.jsx'
import MyResults from '../components/MyResults.jsx'

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
  map.forEach((f) => {
    if (!f.parent || !map.has(f.parent)) roots.push(f)
  })

  function sort(nodes) {
    nodes.sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) ||
        (a.title || a.name || '').localeCompare(b.title || b.name || '')
    )
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
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--ring)] ${
          isActive
            ? 'bg-brand text-brand-contrast'
            : 'text-textc-secondary hover:bg-surface-muted'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <span className="font-medium truncate">
          {node.title || node.name || 'Untitled folder'}
        </span>
        <span className="text-xs text-textc-muted">{node.children.length}</span>
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
  const { currentUser, loading: currentUserLoading } = useCurrentUser()
  const session = useMemo(() => getStoredSession(), [])
  const token = session?.token
  const studentId = session?.id || session?.email || 'student'
  const sessionName = session?.name || ''
  const displayName = currentUser?.name || sessionName

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
      .filter((f) => !f.parent)
      .sort(
        (a, b) =>
          (a.order ?? 999) - (b.order ?? 999) ||
          (a.title || a.name || '').localeCompare(b.title || b.name || '')
      )
    return roots[0]?.id ?? folders[0].id
  }, [folders])

  const childrenOf = useCallback(
    (id) =>
      folders
        .filter((f) => f.parent === id)
        .sort(
          (a, b) =>
            (a.order ?? 999) - (b.order ?? 999) ||
            (a.title || a.name || '').localeCompare(b.title || b.name || '')
        ),
    [folders]
  )

  const fileCountOf = useCallback(
    (id) => files.filter((f) => f.folder === id).length,
    [files]
  )

  const hasDescendantFiles = useCallback(
    (id) => {
      const stack = [...childrenOf(id)]
      while (stack.length) {
        const n = stack.pop()
        if (fileCountOf(n.id) > 0) return true
        stack.push(...childrenOf(n.id))
      }
      return false
    },
    [childrenOf, fileCountOf]
  )

  const filteredFiles = useMemo(() => {
    if (!selectedFolderId) return []
    return files
      .filter((f) => f.folder === selectedFolderId)
      .sort(
        (a, b) =>
          (a.order ?? 999) - (b.order ?? 999) ||
          (a.title || '').localeCompare(b.title || '')
      )
  }, [files, selectedFolderId])

  // load data
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const r = await fetch(`${API_BASE}/content/tree`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const payload = await r.json().catch(() => ({}))
        if (!r.ok) {
          setError(payload?.error || 'Unable to retrieve the content.')
          setFolders([])
          setFiles([])
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
          setFolders([])
          setFiles([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [navigate, token])

  // select default folder
  useEffect(() => {
    if (!folders.length) {
      setSelectedFolderId(null)
      return
    }
    setSelectedFolderId((prev) => {
      if (prev && folders.some((f) => f.id === prev)) return prev
      const root = folders
        .filter((f) => !f.parent)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))[0]
      return root?.id ?? folders[0].id
    })
  }, [folders])

  // auto-open first subfolder with content
  useEffect(() => {
    if (!selectedFolderId) return
    if (filteredFiles.length > 0) return
    const kids = childrenOf(selectedFolderId)
    const target =
      kids.find((k) => fileCountOf(k.id) > 0) ||
      kids.find((k) => hasDescendantFiles(k.id))
    if (target) setSelectedFolderId(target.id)
  }, [selectedFolderId, filteredFiles.length, childrenOf, fileCountOf, hasDescendantFiles])

  // propedeuticity
  const isLocked = useCallback(
    (file, list) => {
      if (file.prereq) {
        const pre = progress[file.prereq]
        return !(pre && pre.completed)
      }
      const sorted = list
        .filter((f) => f.type === 'video')
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      const idx = sorted.findIndex((f) => f.id === file.id)
      if (idx <= 0) return false
      const prev = sorted[idx - 1]
      return !progress[prev.id]?.completed
    },
    [progress]
  )

  const [playing, setPlaying] = useState(null)
  const handleOpenVideo = (file) => setPlaying(file)
  const handleCloseVideo = () => setPlaying(null)

  // ✅ callback stabili: evitano re-render del modal/player
  const handleProgress = useCallback(
    (fileId, seconds) => {
      upsert(fileId, { seconds })
    },
    [upsert]
  )

  const handleComplete = useCallback(
    (fileId) => {
      upsert(fileId, { completed: true })
    },
    [upsert]
  )

  const handleGoToDefaultFolder = useCallback(() => {
    if (defaultFolderId) setSelectedFolderId(defaultFolderId)
  }, [defaultFolderId])

  // scroll helper per i bottoni della dashboard
  const scrollToSection = useCallback((id) => {
    if (typeof document === 'undefined') return
    const el = document.getElementById(id)
    if (!el) return
    const offset = 100 // altezza navbar + respiro
    const y = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }, [])

  const latestAdaptiveResult = useMemo(
    () => adaptiveResults[0] || null,
    [adaptiveResults]
  )

  const featureFlags = useMemo(() => {
    if (currentUser) {
      return {
        courses: Boolean(currentUser?.features?.courses),
        quaet: Boolean(currentUser?.features?.quaet),
        results: Boolean(currentUser?.features?.results),
      }
    }
    if (currentUserLoading) {
      return { courses: true, quaet: true, results: true }
    }
    return { courses: false, quaet: false, results: false }
  }, [currentUser, currentUserLoading])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const loadResults = () => {
      try {
        const raw = window.localStorage.getItem(ADAPTIVE_RESULTS_STORAGE_KEY)
        if (!raw) {
          setAdaptiveResults([])
          return
        }
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
          setAdaptiveResults([])
          return
        }
        const normalized = parsed
          .map((entry, index) => {
            const startedAt = entry?.startedAt || entry?.StartedAt || null
            const completedAt =
              entry?.completedAt || entry?.CompletedAt || startedAt || null
            const askedByLevel =
              typeof entry?.askedByLevel === 'object' &&
              entry?.askedByLevel !== null
                ? entry.askedByLevel
                : typeof entry?.AskedByLevel === 'object' &&
                  entry?.AskedByLevel !== null
                ? entry.AskedByLevel
                : {}
            const askedBySkill =
              typeof entry?.askedBySkill === 'object' &&
              entry?.askedBySkill !== null
                ? entry.askedBySkill
                : typeof entry?.AskedBySkill === 'object' &&
                  entry?.AskedBySkill !== null
                ? entry.AskedBySkill
                : {}
            const totalItemsValue =
              typeof entry?.totalItems === 'number'
                ? entry.totalItems
                : typeof entry?.TotalItems === 'number'
                ? entry.TotalItems
                : null
            const durationValue =
              typeof entry?.durationSec === 'number'
                ? entry.durationSec
                : typeof entry?.DurationSec === 'number'
                ? entry.DurationSec
                : null
            const confidenceRaw =
              typeof entry?.confidence === 'number'
                ? entry.confidence
                : typeof entry?.Confidence === 'number'
                ? entry.Confidence
                : null
            const estimatedLevelValue =
              entry?.estimatedLevel || entry?.EstimatedLevel || null
            const testId = entry?.TestId || entry?.testId || null
            const candidateId = entry?.CandidateId || entry?.candidateId || null

            return {
              ...entry,
              id: entry?.id || `${startedAt || 'attempt'}-${index}`,
              estimatedLevel: estimatedLevelValue,
              EstimatedLevel: estimatedLevelValue,
              confidence: confidenceRaw,
              Confidence: confidenceRaw,
              totalItems: totalItemsValue,
              TotalItems: totalItemsValue,
              durationSec: durationValue,
              DurationSec: durationValue,
              askedByLevel,
              askedBySkill,
              startedAt,
              completedAt,
              CompletedAt: completedAt,
              TestId: testId,
              testId: testId,
              CandidateId: candidateId,
              candidateId: candidateId,
            }
          })
          .sort((a, b) => {
            const aTime = new Date(
              a.completedAt || a.startedAt || 0
            ).getTime()
            const bTime = new Date(
              b.completedAt || b.startedAt || 0
            ).getTime()
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
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return '—'
    }
  }, [])

  const formatDuration = useCallback((seconds) => {
    if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '—'
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60
    const minLabel = minutes ? `${minutes}m` : ''
    const secLabel = `${remaining}s`
    return `${minLabel}${minLabel ? ' ' : ''}${secLabel}`.trim()
  }, [])

  const latestResultCard = useMemo(() => {
    if (!latestAdaptiveResult) return null
    const completed =
      latestAdaptiveResult.completedAt || latestAdaptiveResult.startedAt
    const confidencePct =
      typeof latestAdaptiveResult.confidence === 'number'
        ? Math.round(latestAdaptiveResult.confidence * 100)
        : null
    return {
      level: latestAdaptiveResult.estimatedLevel || '—',
      confidence: confidencePct !== null ? confidencePct : '—',
      date: formatDateTime(completed),
    }
  }, [latestAdaptiveResult, formatDateTime])

  const resultsForTable = useMemo(() => {
    return adaptiveResults.map((attempt, index) => {
      const completed = attempt.completedAt || attempt.startedAt || null
      const confidenceRaw =
        typeof attempt.confidence === 'number'
          ? attempt.confidence
          : typeof attempt.Confidence === 'number'
          ? attempt.Confidence
          : null
      const confidencePct =
        typeof confidenceRaw === 'number'
          ? confidenceRaw > 1
            ? Math.round(confidenceRaw)
            : Math.round(confidenceRaw * 100)
          : null
      const totalItemsValue =
        typeof attempt.totalItems === 'number'
          ? attempt.totalItems
          : typeof attempt.TotalItems === 'number'
          ? attempt.TotalItems
          : null
      const durationSeconds =
        typeof attempt.durationSec === 'number'
          ? attempt.durationSec
          : typeof attempt.DurationSec === 'number'
          ? attempt.DurationSec
          : null
      const testId = attempt.TestId ?? attempt.testId ?? null
      const candidateId =
        attempt.CandidateId ?? attempt.candidateId ?? null
      const estimatedLevelValue =
        attempt.estimatedLevel ??
        attempt.EstimatedLevel ??
        attempt.level ??
        null

      return {
        ...attempt,
        id: attempt.id || `result-${index}`,
        level: estimatedLevelValue || '—',
        estimatedLevel: estimatedLevelValue,
        EstimatedLevel: estimatedLevelValue,
        confidence: confidencePct,
        Confidence: confidencePct,
        confidenceLabel:
          confidencePct !== null ? `${confidencePct}%` : '—',
        items: totalItemsValue !== null ? totalItemsValue : '—',
        totalItems: totalItemsValue,
        TotalItems: totalItemsValue,
        duration: durationSeconds,
        durationSec: durationSeconds,
        DurationSec: durationSeconds,
        durationLabel: formatDuration(durationSeconds),
        completedAt: completed,
        completedAtLabel: formatDateTime(completed),
        CompletedAt: completed,
        TestId: testId,
        testId: testId,
        CandidateId: candidateId,
        candidateId: candidateId,
      }
    })
  }, [adaptiveResults, formatDateTime, formatDuration])

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="card mb-6 rounded-3xl p-6">
          <h1 className="text-3xl font-semibold text-primary">
            Student area
          </h1>
          <p className="mt-2 text-secondary">
            {displayName
              ? `Hi ${displayName}, welcome to your learning environment`
              : 'Explore your learning contents.'}
          </p>
          <div className="mt-3 text-sm">
            <Link
              to="/logout"
              className="link-brand"
            >
              Logout
            </Link>
          </div>
        </div>

        <div className="card rounded-3xl p-6">
          <DashboardCards
            latestResult={latestResultCard}
            features={featureFlags}
            onGoToCourses={() => scrollToSection('learning-hub')}
            onGoToResults={() => scrollToSection('results-section')}
          />
        </div>

        <FeatureGate
          enabled={featureFlags.courses}
          fallback={
            <div className="card mt-6 rounded-3xl p-6 text-sm text-secondary">
              <h2 className="text-xl font-semibold text-primary">
                Courses area unavailable
              </h2>
              <p className="mt-2">
                This area is not enabled for your account. Contact your school
                administrator for access to the learning content.
              </p>
            </div>
          }
        >
          <div
            id="learning-hub"
            className="mt-6 grid gap-6 lg:grid-cols-[260px,1fr]"
          >
            {/* Sidebar */}
            <aside className="card rounded-3xl p-4">
              <h2 className="px-2 text-sm font-semibold uppercase tracking-wider text-textc-muted">
                Learning Hub
              </h2>
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
                  <p className="px-3 py-2 text-sm text-textc-muted">
                    No folders available.
                  </p>
                )}
              </div>
            </aside>

            {/* Main content */}
            <section className="card rounded-3xl p-6">
              <div className="mb-6">
                <button
                  type="button"
                  onClick={handleGoToDefaultFolder}
                  className="btn-primary inline-flex items-center px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!defaultFolderId}
                >
                  Explore content
                </button>
              </div>

              {error && !loading && (
                <div className="rounded-xl border border-border-strong bg-surface-muted p-3 text-sm text-primary">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[16/9] animate-pulse rounded-2xl bg-surface-muted"
                    />
                  ))}
                </div>
              ) : !selectedFolderId ? (
                <p className="text-sm text-secondary">
                  Select a folder to view content.
                </p>
              ) : filteredFiles.length === 0 ? (
                (() => {
                  const subs = childrenOf(selectedFolderId)
                  if (subs.length === 0) {
                    return (
                      <p className="text-sm text-secondary">
                        This section is empty.
                      </p>
                    )
                  }
                  return (
                    <div>
                      <p className="mb-3 text-sm text-secondary">
                        Select a subsection:
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {subs.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedFolderId(s.id)}
                            className="card flex items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <span className="font-medium truncate">
                              {s.title || s.name || 'Untitled'}
                            </span>
                            <span className="ml-3 inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-surface-muted px-2 py-0.5 text-xs text-textc-muted">
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
                  {filteredFiles.some((f) => f.type === 'video') ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {filteredFiles
                        .filter((f) => f.type === 'video')
                        .map((file) => {
                          const prog = progress[file.id]
                          const pct = file.duration
                            ? Math.min(
                                100,
                                Math.round(
                                  ((prog?.seconds || 0) / file.duration) * 100
                                )
                              )
                            : prog?.completed
                            ? 100
                            : 0
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
                      {filteredFiles.map((file) => (
                        <FileListItem
                          key={file.id}
                          file={file}
                          onOpen={() =>
                            window.open(file.url, '_blank', 'noopener')
                          }
                          onCopy={async () =>
                            navigator.clipboard?.writeText(file.url)
                          }
                          isCopied={false}
                        />
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </div>
        </FeatureGate>

        <FeatureGate
          enabled={featureFlags.results}
          fallback={
            <div className="card mt-10 rounded-3xl p-6 text-sm text-secondary">
              <h2 className="text-2xl font-semibold text-primary">
                My Results
              </h2>
              <p className="mt-2">
                This area is not enabled for your account. Contact your school
                or administrator if you believe this is an error.
              </p>
            </div>
          }
        >
          <section id="results-section" className="mt-10">
            <MyResults results={resultsForTable} currentUser={currentUser} />
          </section>
        </FeatureGate>
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