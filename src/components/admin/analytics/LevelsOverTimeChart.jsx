import React from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function LevelsOverTimeChart({ data = [], colors = {} }) {
  if (!data.length) {
    return <p className="text-sm text-[var(--text-secondary)]">No time-series data available.</p>
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="bucket" tick={{ fill: 'var(--text-secondary)' }} />
          <YAxis allowDecimals={false} tick={{ fill: 'var(--text-secondary)' }} />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: 'var(--border-subtle)' }} />
          <Legend />
          {LEVELS.map((level) => (
            <Line
              key={level}
              type="monotone"
              dataKey={level}
              stroke={colors[level] || 'var(--brand-primary)'}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              hide={data.every((item) => !item[level])}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
