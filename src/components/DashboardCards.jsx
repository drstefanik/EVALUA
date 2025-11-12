import { Link } from 'react-router-dom'

function renderLatestResult(latestResult) {
  if (!latestResult) {
    return 'You have no results yet.'
  }
  const level = latestResult.level ?? '—'
  const confidence =
    typeof latestResult.confidence === 'number'
      ? `${latestResult.confidence}%`
      : latestResult.confidence || '—'
  const date = latestResult.date || '—'
  return (
    <>
      Latest: <strong>{level}</strong> • <strong>{confidence}</strong> on {date}
    </>
  )
}

export default function DashboardCards({ latestResult, features }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features?.courses && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold mb-2">My courses</h3>
          <p className="text-sm text-slate-600">
            Access the learning folders assigned to your profile and resume your progress where you left off.
          </p>
          <div className="mt-auto pt-4">
            <Link
              to="/content"
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-900 px-5 py-3 text-white hover:opacity-90"
            >
              Explore content
            </Link>
          </div>
        </div>
      )}

      {features?.quaet && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold mb-2">Adaptive Test</h3>
          <p className="text-sm text-slate-600">
            Take the official <span className="font-semibold">QUAET</span> Adaptive English Test
            to assess your current level.
          </p>
          <div className="mt-auto pt-4">
            <Link
              to="/adaptive-test"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-white hover:opacity-90"
            >
              Start QUAET Test
            </Link>
          </div>
        </div>
      )}

      {features?.results && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold mb-2">My Results</h3>
          <p className="text-sm text-slate-600">{renderLatestResult(latestResult)}</p>
          <div className="mt-auto pt-4">
            <Link
              to="/student#results"
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-white hover:opacity-90"
            >
              View history
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
