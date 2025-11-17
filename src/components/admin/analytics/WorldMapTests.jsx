import React, { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function computeFill(value, maxValue) {
  if (!value || !maxValue) return 'var(--surface-alt)'
  const ratio = Math.min(1, value / maxValue)
  const start = [12, 60, 74]
  const end = [12, 60, 74]
  const alpha = 0.2 + ratio * 0.55
  return `rgba(${start[0]}, ${start[1]}, ${start[2]}, ${alpha.toFixed(2)})`
}

export default function WorldMapTests({ data = [] }) {
  const [tooltip, setTooltip] = useState(null)

  const { byCountry, maxCount } = useMemo(() => {
    const map = new Map()
    let max = 0
    data.forEach((item) => {
      const key = (item.code || item.country || '').toLowerCase()
      map.set(key, item)
      max = Math.max(max, item.count || 0)
    })
    return { byCountry: map, maxCount: max }
  }, [data])

  return (
    <div className="relative">
      {tooltip ? (
        <div className="absolute left-4 top-4 z-10 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs shadow-soft">
          <div className="font-semibold text-[var(--text-primary)]">{tooltip.country}</div>
          <div className="text-[var(--text-secondary)]">Tests: {tooltip.count}</div>
          {tooltip.topLevel ? (
            <div className="text-[var(--text-secondary)]">Top level: {tooltip.topLevel}</div>
          ) : null}
        </div>
      ) : null}
      <ComposableMap projectionConfig={{ scale: 140 }} className="w-full">
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const key = (geo.properties.ISO_A2 || geo.properties.ISO_A3 || geo.properties.name || '').toLowerCase()
              const match = byCountry.get(key) || byCountry.get((geo.properties.name || '').toLowerCase())
              const count = match?.count || 0
              const byLevel = match?.byLevel || {}
              const topLevel = Object.entries(byLevel).sort((a, b) => b[1] - a[1])[0]?.[0]

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  stroke="var(--border-subtle)"
                  strokeWidth={0.25}
                  onMouseEnter={() => {
                    if (!match) return setTooltip(null)
                    setTooltip({
                      country: match.country || geo.properties.name,
                      count,
                      topLevel,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { fill: computeFill(count, maxCount) },
                    hover: { fill: 'rgba(12, 60, 74, 0.6)' },
                    pressed: { fill: 'rgba(12, 60, 74, 0.6)' },
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  )
}
