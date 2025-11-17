import React, { useMemo } from 'react'
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function LevelDonutChart({ distribution = {}, colors = {} }) {
  const chartData = useMemo(() => {
    return LEVELS.filter((level) => distribution[level]).map((level) => ({
      name: level,
      value: distribution[level],
      fill: colors[level] || 'var(--brand-primary)',
    }))
  }, [distribution, colors])

  if (!chartData.length) {
    return <p className="text-sm text-[var(--text-secondary)]">No level data available.</p>
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, borderColor: 'var(--border-subtle)' }}
            formatter={(value, name) => [value, `Level ${name}`]}
          />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
