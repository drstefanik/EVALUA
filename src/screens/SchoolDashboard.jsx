import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSchoolCode, fetchStudentsBySchool, getStoredSession } from '../api'

export default function SchoolDashboard() {
  const session = useMemo(() => getStoredSession(), [])
  const initialCode = session?.schoolCode || ''
  const initialName = session?.name || session?.schoolName || ''
  const token = session?.token
  const [schoolName, setSchoolName] = useState(initialName)
  const [code, setCode] = useState(initialCode)
  const [loadingCode, setLoadingCode] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [students, setStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState('')

  useEffect(() => {
    let active = true

    async function loadCode() {
      setLoadingCode(true)
      setCodeError('')
      try {
        const data = await fetchSchoolCode()
        if (!active) return
        if (data?.schoolCode) {
          setCode(data.schoolCode)
        }
        if (data?.schoolName) {
          setSchoolName(data.schoolName)
        }
      } catch (error) {
        if (!active) return
        console.error('Unable to fetch school code', error)
        const message = error?.message || 'Unable to fetch the School Code.'
        setCodeError(message)
      } finally {
        if (active) {
          setLoadingCode(false)
        }
      }
    }

    if (token) {
      loadCode()
    }

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    let active = true

    if (!code) {
      setStudents([])
      setLoadingStudents(false)
      setStudentsError('')
      return () => {
        active = false
      }
    }

    setLoadingStudents(true)
    setStudentsError('')

    fetchStudentsBySchool(code)
      .then((res) => {
        if (!active) return
        setStudents(Array.isArray(res?.records) ? res.records : [])
      })
      .catch((error) => {
        console.error('Unable to fetch students', error)
        if (!active) return
        const message = error?.message || 'Unable to fetch the students.'
        setStudentsError(message)
        setStudents([])
      })
      .finally(() => {
        if (active) {
          setLoadingStudents(false)
        }
      })

    return () => {
      active = false
    }
  }, [code])

  async function handleCopy() {
    if (!code) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
        setCopyMessage('School code copied to clipboard!')
      } else {
        throw new Error('Clipboard API not available')
      }
    } catch (error) {
      console.error('Copy school code failed', error)
      setCopyMessage('Manual copy: select the code and press Ctrl+C.')
    }

    setTimeout(() => {
      setCopyMessage('')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="card rounded-3xl p-8">
          <h1 className="text-3xl font-semibold text-primary">School area</h1>
          <p className="mt-3 text-secondary">
            {schoolName
              ? `Welcome ${schoolName}! Manage the School Code to share with your students.`
              : 'Welcome to your school dashboard. Access materials and manage your School Code here.'}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-sm text-secondary">
            <span>Want to sign out?</span>
            <Link to="/logout" className="link-brand">
              Logout
            </Link>
          </div>
        </div>

        <div className="card rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-primary">School Code</h2>
          <p className="mt-2 text-sm text-secondary">
            Share this code with students so they can register for EVALUA Education courses.
          </p>

          {codeError && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-border-strong bg-surface-muted px-4 py-3 text-sm text-primary"
            >
              {codeError}
            </div>
          )}

          <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border-strong bg-surface-muted px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-textc-muted">Active code</p>
              <p className="mt-2 text-3xl font-semibold tracking-[0.2em] text-primary">
                {loadingCode ? '••••••••' : code || '— — — — — — — —'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!code || loadingCode}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copy code
            </button>
          </div>

          {copyMessage && (
            <p className="mt-3 text-sm text-brand" aria-live="polite">
              {copyMessage}
            </p>
          )}
        </div>

        <div className="card rounded-3xl p-8">
          <h2 className="text-2xl font-semibold text-primary">My students</h2>
          <p className="mt-2 text-sm text-secondary">
            List of students registered with your School Code.
          </p>

          {studentsError && (
            <div
              role="alert"
              className="mt-5 rounded-2xl border border-border-strong bg-surface-muted px-4 py-3 text-sm text-primary"
            >
              {studentsError}
            </div>
          )}

          {loadingStudents && !studentsError && (
            <p className="mt-6 text-sm text-textc-muted">Loading students…</p>
          )}

          {!loadingStudents && !studentsError && students.length === 0 && (
            <p className="mt-6 text-sm text-textc-muted">No students registered yet.</p>
          )}

          {!loadingStudents && students.length > 0 && (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="py-2 px-3 font-semibold text-primary">Name</th>
                    <th className="py-2 px-3 font-semibold text-primary">Email</th>
                    <th className="py-2 px-3 font-semibold text-primary">Registration date</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr
                      key={st.id}
                      className="border-b border-border-subtle last:border-0 hover:bg-surface-muted"
                    >
                      <td className="py-2 px-3 text-secondary">{st.name}</td>
                      <td className="py-2 px-3 text-secondary">{st.email}</td>
                      <td className="py-2 px-3 text-secondary">{st.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
