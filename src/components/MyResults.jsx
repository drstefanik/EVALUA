import { useState } from 'react'
import { generateCertificatePDF } from '../utils/certPdf.js'

function formatValue(value) {
  if (value === null || value === undefined) return '—'
  return value
}

export default function MyResults({ results, currentUser }) {
  const [downloadingId, setDownloadingId] = useState(null)

  const download = async (row) => {
    if (!row) return
    setDownloadingId(row.id)
    try {
      await generateCertificatePDF({
        user: {
          fullName: currentUser?.name || currentUser?.fullName || currentUser?.email || 'Candidate',
          email: currentUser?.email || '',
        },
        result: {
          level: row.level || 'N/A',
          confidence:
            typeof row.confidence === 'number' ? row.confidence : row.confidence ?? 'N/A',
          items: typeof row.items === 'number' ? row.items : row.items ?? '—',
          duration: row.durationLabel || row.duration || '—',
          completedAt: row.completedAtLabel || row.completedAt || new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Unable to generate certificate PDF', error)
      alert('Unable to generate the certificate. Please try again later.')
    } finally {
      setDownloadingId(null)
    }
  }

  const hasResults = Array.isArray(results) && results.length > 0

  return (
    <div
      id="my-results"
      className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
    >
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">My Results</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Track the outcomes of your adaptive assessments and monitor your progress toward certification.
      </p>

      {!hasResults ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-[#111a33] dark:text-slate-300">
          No adaptive test results available yet. Launch your first attempt with the QUAET Adaptive Test above.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <th className="px-3 py-2 font-semibold">Completed</th>
                <th className="px-3 py-2 font-semibold">Estimated level</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
                <th className="px-3 py-2 font-semibold">Items</th>
                <th className="px-3 py-2 font-semibold">Duration</th>
                <th className="px-3 py-2 font-semibold text-right">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {results.map((attempt) => (
                <tr key={attempt.id} className="border-b border-slate-100 last:border-none dark:border-slate-800">
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    {formatValue(attempt.completedAtLabel)}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{formatValue(attempt.level)}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{formatValue(attempt.confidenceLabel)}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{formatValue(attempt.items)}</td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">{formatValue(attempt.durationLabel)}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => download(attempt)}
                      className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-binavy focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                      disabled={downloadingId === attempt.id}
                    >
                      {downloadingId === attempt.id ? 'Preparing…' : 'Download PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
