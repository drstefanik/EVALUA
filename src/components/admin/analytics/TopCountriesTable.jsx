import React from 'react'

export default function TopCountriesTable({ rows = [] }) {
  if (!rows.length) {
    return <p className="text-sm text-[var(--text-secondary)]">No countries to display.</p>
  }

  return (
    <div className="overflow-x-auto text-sm">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[var(--text-secondary)]">
            <th className="px-3 py-2">Country</th>
            <th className="px-3 py-2">Tests</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.country} className="border-t border-[var(--border-subtle)]">
              <td className="px-3 py-2 text-[var(--text-primary)]">{row.country}</td>
              <td className="px-3 py-2 text-[var(--text-primary)]">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
