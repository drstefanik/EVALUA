import React, { useEffect, useMemo, useState } from 'react'
import { fetchAdminAnalytics } from '../../api'
import LevelDonutChart from '../../components/admin/analytics/LevelDonutChart'
import LevelAgeHeatmap from '../../components/admin/analytics/LevelAgeHeatmap'
import WorldMapTests from '../../components/admin/analytics/WorldMapTests'
import LevelsOverTimeChart from '../../components/admin/analytics/LevelsOverTimeChart'
import AnalyticsDetailsTable from '../../components/admin/analytics/AnalyticsDetailsTable'
import TopCountriesTable from '../../components/admin/analytics/TopCountriesTable'

const LEVEL_COLORS = {
  A1: '#0C3C4A',
  A2: '#156070',
  B1: '#1D8596',
  B2: '#26A8BB',
  C1: '#3AC1D3',
  C2: '#7EE2EE',
}

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '12m', label: 'Last 12 months', days: 365 },
]

export default function AdminAnalytics() {
  const [range, setRange] = useState('12m')
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  const { from, to } = useMemo(() => {
    const option = RANGE_OPTIONS.find((o) => o.value === range) || RANGE_OPTIONS[2]
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(toDate.getDate() - option.days)
    return { from: fromDate.toISOString(), to: toDate.toISOString() }
  }, [range])

  useEffect(() => {
    let isMounted = true
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const result = await fetchAdminAnalytics({ from, to })
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Unable to load analytics')
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [from, to, refreshCount])

  const handleRefresh = () => setRefreshCount((v) => v + 1)

  const totalTests = data?.summary?.totalTests || 0
  const hasData = !isLoading && totalTests > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Global Test Analytics</h1>
          <p className="text-[var(--text-secondary)]">
            Monitor worldwide QuAET placements by level, age range, geography, and time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-2 text-[var(--text-primary)] shadow-soft"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            className="rounded-2xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-72 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] shadow-soft"
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !hasData ? (
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-8 text-center shadow-soft">
          <p className="text-[var(--text-secondary)]">No tests found in the selected period.</p>
        </div>
      ) : null}

      {hasData ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Total tests</p>
                  <p className="text-3xl font-semibold text-[var(--text-primary)]">{data.summary.totalTests}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Unique students</p>
                  <p className="text-xl font-semibold text-[var(--text-primary)]">{data.summary.uniqueStudents}</p>
                </div>
              </div>
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                <LevelDonutChart distribution={data.levelsDistribution} colors={LEVEL_COLORS} />
              </div>
            </div>
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Level vs age</h3>
              </div>
              <LevelAgeHeatmap matrix={data.levelAgeMatrix} />
            </div>
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">World map</h3>
                <p className="text-sm text-[var(--text-secondary)]">Tests by country</p>
              </div>
              <WorldMapTests data={data.worldMap} />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Levels over time</h3>
              </div>
              <LevelsOverTimeChart data={data.levelsOverTime} colors={LEVEL_COLORS} />
            </div>
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-base)] p-6 shadow-soft">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Details</h3>
                <p className="text-sm text-[var(--text-secondary)]">Latest {data.details?.length || 0} tests</p>
              </div>
              <AnalyticsDetailsTable rows={data.details} />
              <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Top countries</h4>
                <TopCountriesTable rows={data.topCountries} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
