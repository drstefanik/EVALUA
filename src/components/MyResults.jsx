import { useState } from 'react'
import { fetchCurrentUser } from '../api.js'
import { generateCertificatePDF } from '../utils/certPdf.js'

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  return value
}

function pickField(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return undefined
}

// fallback per recuperare id/email se non arrivano via props
function getLocalUser() {
  try {
    const id = localStorage.getItem('userId') || ''
    const email = localStorage.getItem('userEmail') || ''
    return { id, email }
  } catch {
    return { id: '', email: '' }
  }
}

export default function MyResults({ results, currentUser }) {
  const [downloadingId, setDownloadingId] = useState(null)

  const download = async (attempt) => {
    if (!attempt) return
    setDownloadingId(attempt.id)

    try {
      // ---- User data (ID, anagrafica) ----
      const local = getLocalUser()

      const profileParams = {}
      const preferredId =
        currentUser?.recordId || currentUser?.id || local.id || undefined
      const preferredEmail = currentUser?.email || local.email || undefined
      if (preferredId) profileParams.id = preferredId
      if (preferredEmail) profileParams.email = preferredEmail

      let latestUser = null
      try {
        latestUser = await fetchCurrentUser(profileParams)
      } catch (profileError) {
        console.error(
          'Unable to refresh student profile for certificate',
          profileError
        )
      }

      const sourceUser = latestUser || currentUser || {}

      // CandidateId "bello" generato in Placements (CAND-XXXX)
      const candidateIdResolved =
        attempt.CandidateId ||
        attempt.candidateId ||
        sourceUser?.candidateId ||
        sourceUser?.CandidateId ||
        currentUser?.candidateId ||
        currentUser?.CandidateId ||
        sourceUser?.id ||
        sourceUser?.recordId ||
        currentUser?.id ||
        currentUser?.recordId ||
        local.id ||
        null

      const studentPhotoArray = Array.isArray(sourceUser?.student_photo)
        ? sourceUser.student_photo
        : Array.isArray(currentUser?.student_photo)
        ? currentUser.student_photo
        : []

      const recordId =
        pickField(
          sourceUser?.recordId,
          sourceUser?.id,
          currentUser?.recordId,
          currentUser?.id,
          local.id
        ) || null

      const nameFromSource = pickField(
        sourceUser?.fullName,
        sourceUser?.name,
        [sourceUser?.firstName, sourceUser?.lastName]
          .filter(Boolean)
          .join(' ') || undefined,
        currentUser?.fullName,
        currentUser?.name,
        currentUser?.displayName,
        sourceUser?.email,
        currentUser?.email,
        'Candidate'
      )

      const studentPhotoUrl =
        pickField(
          sourceUser?.studentPhotoUrl,
          currentUser?.studentPhotoUrl,
          studentPhotoArray[0]?.thumbnails?.large?.url,
          studentPhotoArray[0]?.url,
          null
        ) || undefined

      const userPayload = {
        ...sourceUser,
        // usato dal PDF per "Candidate ID" se non arriva da result
        id: pickField(candidateIdResolved, recordId, local.id, '') || '',
        recordId,
        candidateId: candidateIdResolved || undefined,
        fullName: nameFromSource,
        email: pickField(sourceUser?.email, currentUser?.email, local.email, '') || '',
        nationality:
          pickField(
            sourceUser?.nationality,
            currentUser?.nationality,
            currentUser?.Nationality,
            '-'
          ) || '-',
        dateOfBirth:
          pickField(
            sourceUser?.dateOfBirth,
            currentUser?.dateOfBirth,
            currentUser?.DateOfBirth,
            null
          ) || null,
        placeOfBirth:
          pickField(
            sourceUser?.placeOfBirth,
            sourceUser?.place_birth,
            currentUser?.placeOfBirth,
            currentUser?.place_birth,
            currentUser?.PlaceOfBirth,
            ''
          ) || '',
        countryOfBirth:
          pickField(
            sourceUser?.countryOfBirth,
            sourceUser?.country_birth,
            currentUser?.countryOfBirth,
            currentUser?.country_birth,
            currentUser?.CountryOfBirth,
            ''
          ) || '',
        identificationDocument:
          pickField(
            sourceUser?.identificationDocument,
            sourceUser?.identification_document,
            currentUser?.identificationDocument,
            currentUser?.identification_document,
            currentUser?.IdentificationDocument,
            ''
          ) || '',
        documentNumber:
          pickField(
            sourceUser?.documentNumber,
            sourceUser?.document_number,
            currentUser?.documentNumber,
            currentUser?.document_number,
            currentUser?.DocumentNumber,
            ''
          ) || '',
        student_photo: studentPhotoArray,
        studentPhotoUrl,
      }

      // ---- Result data (normalizzato per il PDF) ----
      const testId =
        attempt.TestId ||
        attempt.testId ||
        attempt.placementTestId ||
        attempt.id ||
        null

      const issuedAtIso =
        attempt.CompletedAt ||
        attempt.completedAt ||
        attempt._createdTime ||
        new Date().toISOString()

      const completedAtDisplay =
        attempt.completedAtLabel ||
        issuedAtIso

      const resultPayload = {
        level:
          attempt.level ||
          attempt.EstimatedLevel ||
          attempt.estimatedLevel ||
          'N/A',
        confidence:
          typeof attempt.confidence === 'number'
            ? attempt.confidence
            : (attempt.Confidence ?? attempt.confidence ?? 'N/A'),
        items:
          typeof attempt.items === 'number'
            ? attempt.items
            : (attempt.TotalItems ?? attempt.items ?? '—'),
        duration:
          attempt.durationLabel ||
          attempt.duration ||
          (attempt.DurationSec ? `${attempt.DurationSec}s` : '—'),
        completedAt: completedAtDisplay,

        // NEW: ID coerenti con Placements
        testId,
        candidateId: candidateIdResolved || undefined,
      }

      const certificateRequest = {
        studentId: recordId,
        name: userPayload.fullName,
        testName:
          attempt.testName ||
          attempt.TestName ||
          attempt.placementTestName ||
          'QUAET Adaptive Test',
        level: String(resultPayload.level || '').toUpperCase(),
        issuedAt: issuedAtIso,
      }

      const issueResponse = await fetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateRequest),
      })

      const certificateMeta = await issueResponse.json().catch(() => null)
      if (!issueResponse.ok || !certificateMeta) {
        const message =
          (certificateMeta && certificateMeta.error) ||
          'Unable to register certificate verification.'
        throw new Error(message)
      }

      const resultWithCertificate = {
        ...resultPayload,
        verificationCode: certificateMeta.code,
        verificationUrl: certificateMeta.verificationUrl,
        issuedAt: certificateMeta.issuedAt,
      }

      await generateCertificatePDF({
        user: userPayload,
        result: resultWithCertificate,
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
                <tr
                  key={attempt.id}
                  className="border-b border-slate-100 last:border-none dark:border-slate-800"
                >
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    {formatValue(
                      attempt.completedAtLabel ||
                        attempt.CompletedAt ||
                        attempt._createdTime
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    {formatValue(attempt.level || attempt.EstimatedLevel)}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    {formatValue(
                      attempt.confidenceLabel ??
                        attempt.Confidence ??
                        attempt.confidence
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    {formatValue(attempt.items ?? attempt.TotalItems)}
                  </td>
                  <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                    {formatValue(
                      attempt.durationLabel ??
                        (attempt.DurationSec ? `${attempt.DurationSec}s` : null)
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => download(attempt)}
                      className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-binavy focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                      disabled={downloadingId === attempt.id}
                      title="Download official result certificate (PDF)"
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