import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchSchoolByCode, getStoredSession } from '../api'
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
  const studentName = session?.name || ''
  const schoolCode = session?.schoolCode || ''
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [copiedFileId, setCopiedFileId] = useState(null)
  const copyTimeoutRef = useRef(null)
  const [school, setSchool] = useState(null)
  const [loadingSchool, setLoadingSchool] = useState(false)
  const [schoolError, setSchoolError] = useState('')

  const folderMap = useMemo(() => {
    const map = new Map()
    folders.forEach((folder) => {
      map.set(folder.id, folder)
    })
    return map
  }, [folders])

  const tree = useMemo(() => buildTree(folders), [folders])

  const breadcrumb = useMemo(() => {
    if (!selectedFolderId) return []
    const trail = []
    let currentId = selectedFolderId
    const visited = new Set()
    while (currentId && folderMap.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId)
      const folder = folderMap.get(currentId)
      trail.push(folder)
      currentId = folder?.parent
    }
    return trail.reverse()
  }, [folderMap, selectedFolderId])

  const filteredFiles = useMemo(() => {
    if (!selectedFolderId) return []
    return files
      .filter((file) => file.folder === selectedFolderId)
      .sort((a, b) => {
        const orderDiff = (a.order ?? 999) - (b.order ?? 999)
        if (orderDiff !== 0) return orderDiff
        return (a.title || '').localeCompare(b.title || '')
      })
  }, [files, selectedFolderId])

  const selectFolder = useCallback((folderId) => {
    setSelectedFolderId(folderId)
  }, [])

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    let active = true

    async function loadTree() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_BASE}/content/tree`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401 || response.status === 403) {
          navigate('/login', { replace: true })
          return
        }

        let payload = null
        try {
          payload = await response.json()
        } catch (parseError) {
          payload = null
        }

        if (!response.ok) {
          console.error('Content tree request failed', response.status, payload)
          const message = payload?.error || 'Unable to retrieve the content.'
          if (response.status >= 500) {
            setToast({ message: 'Server error. Please try again later.', tone: 'error' })
          }
          if (active) {
            setError(message)
            setFolders([])
            setFiles([])
          }
          return
        }

        if (!active) return

        const apiFolders = Array.isArray(payload?.folders) ? payload.folders : []
        const apiFiles = Array.isArray(payload?.files) ? payload.files : []
        setFolders(apiFolders)
        setFiles(apiFiles)
      } catch (error) {
        console.error('Unable to load student content tree', error)
        if (active) {
          setError('Connection unavailable. Try again later.')
          setFolders([])
          setFiles([])
          setToast({ message: 'Connection unavailable.', tone: 'error' })
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadTree()

    return () => {
      active = false
    }
  }, [navigate, token])

  useEffect(() => {
    if (folders.length === 0) {
      setSelectedFolderId(null)
      return
    }

    setSelectedFolderId((prev) => {
      if (prev && folders.some((folder) => folder.id === prev)) {
        return prev
      }

      const candidates = folders
        .filter((folder) => !folder.parent)
        .sort((a, b) => {
          const orderDiff = (a.order ?? 0) - (b.order ?? 0)
          if (orderDiff !== 0) return orderDiff
          return (a.name || '').localeCompare(b.name || '')
        })

      if (candidates.length > 0) {
        return candidates[0].id
      }

      return folders[0].id
    })
  }, [folders])

  useEffect(() => {
    let active = true

    if (!schoolCode) {
      setSchool(null)
      setSchoolError('')
      setLoadingSchool(false)
      return () => {
        active = false
      }
    }

    setLoadingSchool(true)
    setSchoolError('')

    fetchSchoolByCode(schoolCode)
      .then((res) => {
        if (!active) return
        setSchool(res?.record || null)
      })
      .catch((error) => {
        console.error('Unable to fetch school information', error)
        if (!active) return
        const message = error?.message || 'Unable to fetch the school information.'
        setSchoolError(message)
        setSchool(null)
      })
      .finally(() => {
        if (active) {
          setLoadingSchool(false)
        }
      })

    return () => {
      active = false
    }
  }, [schoolCode])

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const handleOpenFile = useCallback((url) => {
    if (!url) return
    window.open(url, '_blank', 'noopener')
  }, [])

  const handleCopyLink = useCallback(
    async (file) => {
      const url = file?.url
      if (!url) return
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(url)
          if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current)
          }
          setCopiedFileId(file.id)
          copyTimeoutRef.current = setTimeout(() => setCopiedFileId(null), 1500)
        } else {
          throw new Error('Clipboard API not available')
      }
    } catch (error) {
      console.error('Copy file link failed', error)
        setToast({ message: 'Unable to copy the link. Please copy it manually.', tone: 'error', duration: 4000 })
      }
    },
    [],
  )

  const closeToast = useCallback(() => setToast(null), [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-biwhite via-biwhite to-binavy/10 dark:from-[#0a0f1f] dark:via-[#0a0f1f] dark:to-[#001c5e]">
      <Toast toast={toast} onClose={closeToast} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <h1 className="text-3xl font-semibold text-binavy dark:text-white">Student area</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            {studentName
              ? `Hi ${studentName}, explore the materials shared with you by your school.`
              : "Access the materials shared with your school's students."}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-binavy dark:text-slate-200">
            <span>Want to sign out?</span>
            <Link to="/logout" className="font-semibold text-binavy underline-offset-4 hover:text-bireg dark:text-white dark:hover:text-bireg">
              Logout
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">My school</h2>
          {schoolError && (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-bireg/20 bg-bireg/10 px-4 py-3 text-sm text-bireg"
            >
              {schoolError}
            </div>
          )}
          {loadingSchool && !schoolError && (
            <p className="mt-3 text-sm text-slate-500">Loading information...</p>
          )}
          {!loadingSchool && !schoolError && !school && (
            <p className="mt-3 text-sm text-slate-500">
              No school associated. Make sure you entered the School Code during sign-up.
            </p>
          )}
          {!loadingSchool && school && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-800/60">
              <p className="text-lg font-semibold text-binavy dark:text-white">{school.name}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{school.email}</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px,1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="px-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">
              Folders
            </h2>
            {loading ? (
              <div className="mt-4 space-y-2 px-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="h-10 w-full animate-pulse rounded-xl bg-binavy/10 dark:bg-white/10" />
                ))}
              </div>
            ) : folders.length === 0 ? (
              <p className="mt-4 px-2 text-sm text-slate-600 dark:text-slate-400">
                No folders available right now.
              </p>
            ) : (
              <div className="mt-3 space-y-1">
                {tree.map((node) => (
                  <FolderNode
                    key={node.id}
                    node={node}
                    depth={0}
                    onSelect={selectFolder}
                    selectedId={selectedFolderId}
                  />
                ))}
              </div>
            )}
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-300" aria-label="Percorso cartella">
                  {breadcrumb.length === 0 ? (
                    <span className="font-medium text-slate-700 dark:text-slate-200">Select a folder</span>
                  ) : (
                    breadcrumb.map((folder, index) => (
                      <React.Fragment key={folder.id}>
                        <button
                          type="button"
                          onClick={() => selectFolder(folder.id)}
                          className={`rounded-full px-3 py-1 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0a0f1f] ${
                            index === breadcrumb.length - 1
                              ? 'bg-binavy text-white focus-visible:ring-bireg'
                              : 'bg-biwhite text-binavy hover:bg-binavy/10 focus-visible:ring-binavy/40 dark:bg-[#111a33] dark:text-slate-200 dark:hover:bg-[#1a2750] dark:focus-visible:ring-[#6a87ff]/60'
                          }`}
                        >
                          {folder.name || 'Folder'}
                        </button>
                        {index !== breadcrumb.length - 1 && <span className="text-slate-300 dark:text-slate-600">/</span>}
                      </React.Fragment>
                    ))
                  )}
                </nav>
                {selectedFolderId && folderMap.get(selectedFolderId)?.description && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {folderMap.get(selectedFolderId).description}
                  </p>
                )}
              </div>
              <div className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {filteredFiles.length}{' '}
                {filteredFiles.length === 1 ? 'file available' : 'files available'}
              </div>
            </div>

            {error && !loading ? (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-bireg/20 bg-bireg/10 px-4 py-3 text-sm text-bireg"
              >
                {error}
              </div>
            ) : loading ? (
              <div className="mt-6 space-y-4">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-binavy/5 p-4 dark:border-white/10 dark:bg-[#111a33] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-lg bg-binavy/20 dark:bg-white/10" />
                      <div className="space-y-2">
                        <div className="h-4 w-40 animate-pulse rounded bg-binavy/20 dark:bg-white/10" />
                        <div className="h-3 w-24 animate-pulse rounded bg-binavy/20 dark:bg-white/10" />
                      </div>
                    </div>
                    <div className="flex w-full max-w-[180px] items-center gap-2 sm:w-auto">
                      <div className="h-8 flex-1 animate-pulse rounded-lg bg-binavy/20 dark:bg-white/10" />
                      <div className="h-8 flex-1 animate-pulse rounded-lg bg-binavy/20 dark:bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !selectedFolderId ? (
              <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
                Select a folder from the sidebar to see the available files.
              </p>
            ) : filteredFiles.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">No files available in this folder.</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {filteredFiles.map((file) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    onOpen={() => handleOpenFile(file.url)}
                    onCopy={() => handleCopyLink(file)}
                    isCopied={copiedFileId === file.id}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
