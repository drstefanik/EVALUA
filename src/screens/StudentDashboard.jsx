import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoredSession } from '../api'
import useProgress from '../hooks/useProgress'
import VideoCard from '../components/VideoCard'
import VideoModal from '../components/VideoModal'
import FileListItem from '../components/FileListItem'

const API_BASE = import.meta.env.VITE_AUTH_API ?? '/api'

function buildTree(folders) {
  const map = new Map()
  folders.forEach((folder) => {
    map.set(folder.id, { ...folder, children: [] })
  })

  map.forEach((folder) => {
    if (folder.parent && map.has(folder.parent)) {
      map.get(folder.parent).children.push(folder)
    }
  })

  const roots = []
  map.forEach((folder) => {
    if (!folder.parent || !map.has(folder.parent)) {
      roots.push(folder)
    }
  })

  function sortNodes(nodes) {
    nodes.sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return (a.name || '').localeCompare(b.name || '')
    })
    nodes.forEach((node) => sortNodes(node.children))
  }

  sortNodes(roots)
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
        <span className="font-medium">{node.name || 'Untitled folder'}</span>
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

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const duration = typeof toast.duration === 'number' ? toast.duration : 4000
    const timeout = setTimeout(onClose, duration)
    return () => clearTimeout(timeout)
  }, [toast, onClose])

  if (!toast) return null

  const toneClass = toast.tone === 'error' ? 'bg-bireg' : 'bg-emerald-600'

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white shadow-soft ${toneClass}`}
      >
        <span>{toast.message}</span>
      </div>
    </div>
  )
}

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

  const { progress, loading: loadingProgress, upsert } = useProgress(token, studentId)

  const folderMap = useMemo(() => {
    const m = new Map()
    folders.forEach(f => m.set(f.id, f))
    return m
  }, [folders])

  const tree = useMemo(() => buildTree(folders), [folders])

  const filteredFiles = useMemo(() => {
    if (!selectedFolderId) return []
    return files
      .filter((f) => f.folder === selectedFolderId)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.title||'').localeCompare(b.title||''))
  }, [files, selectedFolderId])

  // caricamento al mount
  useEffect(() => {
    if (!token) { navigate('/login', { replace: true }); return }
    let active = true
    async function load() {
      setLoading(true); setError('')
      try {
        const r = await fetch(`${API_BASE}/content/tree`, { headers: { Authorization: `Bearer ${token}` } })
        const payload = await r.json().catch(()=> ({}))
        if (!r.ok) { setError(payload?.error || 'Unable to retrieve the content.'); setFolders([]); setFiles([]); return }
        if (!active) return
        setFolders(Array.isArray(payload?.folders) ? payload.folders : [])
        setFiles(Array.isArray(payload?.files) ? payload.files : [])
      } catch {
        if (active) { setError('Connection unavailable. Try again later.'); setFolders([]); setFiles([]) }
      } finally { if (active) setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [navigate, token])

  useEffect(() => {
    if (!folders.length) { setSelectedFolderId(null); return }
    setSelectedFolderId(prev => {
      if (prev && folders.some(f=>f.id===prev)) return prev
      const root = folders.filter(f=>!f.parent).sort((a,b)=>(a.order??0)-(b.order??0))[0]
      return root?.id ?? folders[0].id
    })
  }, [folders])

  // regole di propedeuticità
  const isLocked = useCallback((file, list) => {
    // 1) Se ha un prerequisito esplicito
    if (file.prereq) {
      const pre = progress[file.prereq]
      return !(pre && pre.completed)
    }
    // 2) altrimenti usa l’ordine: serve il file con order subito precedente
    const sorted = list.filter(f=>f.type==='video').sort((a,b)=>(a.order??999)-(b.order??999))
    const idx = sorted.findIndex(f=>f.id===file.id)
    if (idx <= 0) return false
    const prev = sorted[idx-1]
    const done = progress[prev.id]?.completed
    return !done
  }, [progress])

  const [playing, setPlaying] = useState(null) // file in riproduzione

  const handleOpenVideo = (file) => setPlaying(file)
  const handleCloseVideo = () => setPlaying(null)

  const handleProgress = (fileId, seconds) => {
    upsert(fileId, { seconds })
  }
  const handleComplete = (fileId) => {
    upsert(fileId, { completed: true })
  }

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-biwhite via-biwhite to-binavy/10 dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#001c5e]">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <h1 className="text-3xl font-semibold text-binavy dark:text-white">Student area</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {studentName ? `Hi ${studentName}, your learning library is below.` : 'Explore your learning library.'}
          </p>
          <div className="mt-3 text-sm">
            <Link to="/logout" className="font-semibold underline-offset-4 text-binavy hover:text-bireg dark:text-white">Logout</Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px,1fr]">
          {/* Sidebar folder tree (uguale al tuo, puoi riusare FolderNode) */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="px-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Folders</h2>
            {/* …incolla qui il tuo albero (FolderNode) */}
          </aside>

          {/* Contenuto */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            {error && !loading && <div className="rounded-xl border border-bireg/30 bg-bireg/10 p-3 text-sm text-bireg">{error}</div>}

            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({length:8}).map((_,i)=>(
                  <div key={i} className="aspect-[16/9] animate-pulse rounded-2xl bg-slate-200/50 dark:bg-white/10" />
                ))}
              </div>
            ) : !selectedFolderId ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">Select a folder to view content.</p>
            ) : (
              <>
                {/* Netflix-style: se nel folder ci sono video → griglia card; altrimenti lista file */}
                {filteredFiles.some(f=>f.type==='video') ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {filteredFiles.filter(f=>f.type==='video').map(file=>{
                      const prog = progress[file.id]
                      const pct = file.duration ? Math.min(100, Math.round(((prog?.seconds||0) / file.duration) * 100)) : (prog?.completed ? 100 : 0)
                      const locked = isLocked(file, filteredFiles)
                      return (
                        <VideoCard
                          key={file.id}
                          file={file}
                          locked={locked}
                          progressPct={pct}
                          onClick={()=>handleOpenVideo(file)}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {filteredFiles.map(file=>(
                      <FileListItem
                        key={file.id}
                        file={file}
                        onOpen={()=> window.open(file.url, '_blank', 'noopener')}
                        onCopy={async()=> navigator.clipboard?.writeText(file.url)}
                        isCopied={false}
                      />
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {/* Modal video */}
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
