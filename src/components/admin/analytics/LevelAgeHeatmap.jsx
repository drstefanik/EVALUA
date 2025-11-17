import React, { useMemo } from 'react'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const AGE_RANGES = ['<=12', '13-15', '16-18', '19-25', '26-40', '>40']

function intensityColor(value, max) {
  if (!value || !max) return 'rgba(12, 60, 74, 0.08)'
  const ratio = Math.min(1, value / max)
  const alpha = 0.15 + ratio * 0.65
  return `rgba(12, 60, 74, ${alpha.toFixed(2)})`
}

export default function LevelAgeHeatmap({ matrix = {} }) {
  const normalized = useMemo(() => {
    const grid = {}
    let max = 0

    AGE_RANGES.forEach((age) => {
      LEVELS.forEach((level) => {
        grid[`${level}-${age}`] = 0
      })
    })

    if (Array.isArray(matrix)) {
      matrix.forEach((item) => {
        const key = `${item.level}-${item.ageRange}`
        grid[key] = item.count
        max = Math.max(max, item.count)
      })
    }

    return { grid, max }
  }, [matrix])

  if (!normalized.max) {
    return <p className="text-sm text-[var(--text-secondary)]">No age-level data available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-[var(--text-secondary)]">Age range</th>
            {LEVELS.map((lvl) => (
              <th key={lvl} className="px-2 py-1 text-center text-[var(--text-secondary)]">
                {lvl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {AGE_RANGES.map((age) => (
            <tr key={age}>
              <td className="py-2 pr-3 text-[var(--text-primary)]">{age}</td>
              {LEVELS.map((level) => {
                const key = `${level}-${age}`
                const value = normalized.grid[key] || 0
                const color = intensityColor(value, normalized.max)
                return (
                  <td key={key} className="px-1 py-2">
                    <div
                      className="flex h-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] text-xs"
                      style={{ backgroundColor: color }}
                      title={`${level} / ${age}: ${value}`}
                    >
                      {value}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
