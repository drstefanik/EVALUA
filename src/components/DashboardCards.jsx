import { Link } from 'react-router-dom'

function renderLatestResult(latestResult) {
  if (!latestResult) {
    return 'You have no results yet.'
  }
  const levelSource =
    latestResult.estimatedLevel ??
    latestResult.level ??
    latestResult.Level ??
    latestResult.EstimatedLevel ??
    '—'
  const level =
    levelSource && levelSource !== '—' ? String(levelSource).toUpperCase() : '—'

  const confidenceRaw = (() => {
    if (typeof latestResult.confidence === 'number') return latestResult.confidence
    if (typeof latestResult.Confidence === 'number') return latestResult.Confidence
    if (typeof latestResult.confidencePct === 'number')
      return latestResult.confidencePct
    return null
  })()

  let confidence = '—'
  if (typeof confidenceRaw === 'number' && !Number.isNaN(confidenceRaw)) {
    const normalized = confidenceRaw > 1 ? Math.round(confidenceRaw) : Math.round(confidenceRaw * 100)
    confidence = `${normalized}%`
  } else {
    confidence =
      latestResult.confidence ||
      latestResult.Confidence ||
      latestResult.confidenceLabel ||
      '—'
  }

  const dateSource =
    latestResult.date ||
    latestResult.completedAt ||
    latestResult.CompletedAt ||
    latestResult.startedAt ||
    latestResult.StartedAt ||
    null

  let date = '—'
  if (dateSource) {
    const parsed = new Date(dateSource)
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed.toLocaleDateString('en-GB')
    } else if (typeof dateSource === 'string') {
      date = dateSource
    }
  }
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
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      {features?.personal_details && (
        <div className="card p-6 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-primary">Personal details</h3>
          <p className="text-sm text-secondary">Review and update your personal information.</p>
          <div className="mt-auto pt-4">
            <a
              href="#personal-details"
              onClick={() => onGoToPersonalDetails?.()}
              className="btn-primary inline-flex w-full items-center justify-center"
            >
              Manage
            </a>
          </div>
        </div>
      )}

      {features?.courses && (
        <div className="card p-6 flex flex-col">
          <h3 className="text-xl font-semibold mb-2 text-primary">My courses</h3>
          <p className="text-sm text-secondary">
            Access the learning folders assigned to your profile and resume your progress where you left off.
          </p>
          <div className="mt-auto pt-4">
            <a
              href="#learning-hub"
              onClick={() => onGoToCourses?.()}
              className="btn-primary inline-flex w-full items-center justify-center"
            >
              Explore content
            </a>
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
            <a
              href="#my-results"
              onClick={() => onGoToResults?.()}
              className="btn-ghost inline-flex w-full items-center justify-center"
            >
              View history
            </a>
          </div>
        </div>
      )}
    </div>
  )
}