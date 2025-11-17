import React, { useMemo, useState } from 'react'

export default function AnalyticsDetailsTable({ rows = [] }) {
  const [sort, setSort] = useState('desc')

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const da = new Date(a.date).getTime()
      const db = new Date(b.date).getTime()
      return sort === 'asc' ? da - db : db - da
    })
    return copy
  }, [rows, sort])

  const toggleSort = () => setSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))

  if (!rows.length) {
    return <p className="text-sm text-[var(--text-secondary)]">No tests in this range.</p>
  }

  return (
    <div className="overflow-x-auto text-sm">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="text-left text-[var(--text-secondary)]">
            <th className="cursor-pointer px-3 py-2" onClick={toggleSort}>
              Date {sort === 'desc' ? '↓' : '↑'}
            </th>
            <th className="px-3 py-2">Student</th>
            <th className="px-3 py-2">City</th>
            <th className="px-3 py-2">Country</th>
            <th className="px-3 py-2">Level</th>
            <th className="px-3 py-2">Duration</th>
            <th className="px-3 py-2">Test ID</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr key={`${row.testId || row.date}-${idx}`} className="border-t border-[var(--border-subtle)]">
              <td className="px-3 py-2 text-[var(--text-primary)]">
                {row.date ? new Date(row.date).toLocaleDateString() : '—'}
              </td>
              <td className="px-3 py-2 text-[var(--text-primary)]">{row.studentName || '—'}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{row.city || '—'}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{row.country || '—'}</td>
              <td className="px-3 py-2 text-[var(--text-primary)]">{row.level || '—'}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{row.duration ? `${row.duration} s` : '—'}</td>
              <td className="px-3 py-2 text-[var(--text-secondary)]">{row.testId || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
