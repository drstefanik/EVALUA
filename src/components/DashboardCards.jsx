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

export default function DashboardCards({
  latestResult,
  features,
  onGoToCourses,
  onGoToResults,
  onGoToPersonalDetails,
}) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {features?.courses && (
        <div className="card p-6 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-primary">My courses</h3>
          <p className="text-sm text-secondary">
            Access the learning folders assigned to your profile and resume your progress where you left off.
          </p>
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={onGoToCourses}
              disabled={!onGoToCourses}
              className="btn-primary inline-flex w-full items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Explore content
            </button>
          </div>
        </div>
      )}

      {features?.quaet && (
        <div className="card p-6 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-primary">Adaptive Test</h3>
          <p className="text-sm text-secondary">
            Take the official <span className="font-semibold">QUAET</span> Adaptive English Test
            to assess your current level.
          </p>
          <div className="mt-auto pt-4">
            <Link
              to="/adaptive-test"
              className="btn-primary inline-flex w-full items-center justify-center"
            >
              Start QUAET Test
            </Link>
          </div>
        </div>
      )}

      {features?.results && (
        <div className="card p-6 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-primary">My Results</h3>
          <p className="text-sm text-secondary">{renderLatestResult(latestResult)}</p>
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={onGoToResults}
              disabled={!onGoToResults}
              className="btn-ghost inline-flex w-full items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              View history
            </button>
          </div>
        </div>
      )}

      {features?.personal_details && (
        <div className="card p-6 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-primary">Personal details</h3>
          <p className="text-sm text-secondary">Review and update your personal information</p>
          <div className="mt-auto pt-4">
            <button
              type="button"
              onClick={onGoToPersonalDetails}
              disabled={!onGoToPersonalDetails}
              className="btn-primary inline-flex w-full items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Manage
            </button>
          </div>
        </div>
      )}
    </div>
  )
}