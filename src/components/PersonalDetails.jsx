import React, { useEffect, useMemo, useState } from 'react'
import { ApiError, updateStudentProfile } from '../api.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
  'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Chad', 'Chile', 'China', 'Colombia', 'Congo',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Ethiopia', 'Finland', 'France', 'Gabon', 'Georgia',
  'Germany', 'Ghana', 'Greece', 'Guatemala', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Libya', 'Liechtenstein', 'Lithuania',
  'Luxembourg', 'Macau', 'Madagascar', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Mexico', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'San Marino', 'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'Slovakia',
  'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Syria',
  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

const IDENTIFICATION_DOCUMENT_OPTIONS = [
  'Passport',
  'National ID',
  'Residence Permit',
  'Driver License',
  'Other',
]

function NationalitySelect({ value, onChange, disabled, name, ariaInvalid, ariaDescribedBy }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return COUNTRIES.filter((country) => country.toLowerCase().includes(q)).slice(0, 50)
  }, [query])

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        name={name}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        placeholder="Start typing…"
        value={open ? query : value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {(filtered.length ? filtered : ['No results']).map((country) => (
            <button
              key={country}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(country === 'No results' ? '' : country)
                setQuery('')
                setOpen(false)
              }}
              disabled={country === 'No results'}
            >
              {country}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function attachmentsAreEqual(a, b) {
  const normalize = (list) =>
    JSON.stringify(
      (Array.isArray(list) ? list : []).map((item) => ({
        id: item?.id || null,
        url: item?.url || '',
        filename: item?.filename || item?.name || '',
      }))
    )
  return normalize(a) === normalize(b)
}

export default function PersonalDetails({ currentUser, onProfileUpdated }) {
  const baseline = useMemo(() => {
    return {
      firstName: currentUser?.firstName || currentUser?.first_name || '',
      lastName: currentUser?.lastName || currentUser?.last_name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      dateOfBirth: currentUser?.dateOfBirth || currentUser?.date_of_birth || '',
      nationality: currentUser?.nationality || '',
      placeOfBirth: currentUser?.placeOfBirth || currentUser?.place_birth || '',
      countryOfBirth: currentUser?.countryOfBirth || currentUser?.country_birth || '',
      identificationDocument:
        currentUser?.identificationDocument || currentUser?.identification_document || '',
      documentNumber: currentUser?.documentNumber || currentUser?.document_number || '',
      studentPhoto: Array.isArray(currentUser?.student_photo) ? currentUser.student_photo : [],
    }
  }, [currentUser])

  const [firstName, setFirstName] = useState(baseline.firstName)
  const [lastName, setLastName] = useState(baseline.lastName)
  const [email, setEmail] = useState(baseline.email)
  const [phone, setPhone] = useState(baseline.phone)
  const [dateOfBirth, setDateOfBirth] = useState(baseline.dateOfBirth)
  const [nationality, setNationality] = useState(baseline.nationality)
  const [placeOfBirth, setPlaceOfBirth] = useState(baseline.placeOfBirth)
  const [countryOfBirth, setCountryOfBirth] = useState(baseline.countryOfBirth)
  const [identificationDocument, setIdentificationDocument] = useState(baseline.identificationDocument)
  const [documentNumber, setDocumentNumber] = useState(baseline.documentNumber)
  const [studentPhoto, setStudentPhoto] = useState(baseline.studentPhoto)
  const [pendingPhoto, setPendingPhoto] = useState(null)
  const [clientErrors, setClientErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [internalBaseline, setInternalBaseline] = useState(baseline)

  useEffect(() => {
    setFirstName(baseline.firstName)
    setLastName(baseline.lastName)
    setEmail(baseline.email)
    setPhone(baseline.phone)
    setDateOfBirth(baseline.dateOfBirth)
    setNationality(baseline.nationality)
    setPlaceOfBirth(baseline.placeOfBirth)
    setCountryOfBirth(baseline.countryOfBirth)
    setIdentificationDocument(baseline.identificationDocument)
    setDocumentNumber(baseline.documentNumber)
    setStudentPhoto(baseline.studentPhoto)
    setPendingPhoto(null)
    setClientErrors({})
    setError('')
    setSuccess('')
    setInternalBaseline(baseline)
  }, [baseline])

  const displayPhotoUrl = pendingPhoto?.preview || studentPhoto?.[0]?.url || ''

  const isValid = useMemo(() => {
    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    const trimmedPlace = placeOfBirth.trim()
    const trimmedCountry = countryOfBirth.trim()
    const trimmedDocument = identificationDocument.trim()
    const trimmedNumber = documentNumber.trim()

    const firstOk = trimmedFirst.length > 1
    const lastOk = trimmedLast.length > 1
    const emailOk = emailRegex.test(trimmedEmail)
    const phoneOk = !trimmedPhone || (trimmedPhone.length >= 7 && trimmedPhone.length <= 20)
    const dobOk = !dateOfBirth || isoDateRegex.test(dateOfBirth)
    const placeOk = trimmedPlace.length > 0
    const countryOk = trimmedCountry.length > 0
  const docTypeOk =
    trimmedDocument.length > 0 && IDENTIFICATION_DOCUMENT_OPTIONS.includes(trimmedDocument)
    const docNumberOk = trimmedNumber.length > 0

    return firstOk && lastOk && emailOk && phoneOk && dobOk && placeOk && countryOk && docTypeOk && docNumberOk
  }, [firstName, lastName, email, phone, dateOfBirth, placeOfBirth, countryOfBirth, identificationDocument, documentNumber])

  const isDirty = useMemo(() => {
    if (!internalBaseline) return false
    const baselineMatch =
      firstName === internalBaseline.firstName &&
      lastName === internalBaseline.lastName &&
      phone === internalBaseline.phone &&
      dateOfBirth === internalBaseline.dateOfBirth &&
      nationality === internalBaseline.nationality &&
      placeOfBirth === internalBaseline.placeOfBirth &&
      countryOfBirth === internalBaseline.countryOfBirth &&
      identificationDocument === internalBaseline.identificationDocument &&
      documentNumber === internalBaseline.documentNumber &&
      attachmentsAreEqual(studentPhoto, internalBaseline.studentPhoto)
    if (!baselineMatch) return true
    if (pendingPhoto) return true
    return false
  }, [internalBaseline, firstName, lastName, phone, dateOfBirth, nationality, placeOfBirth, countryOfBirth, identificationDocument, documentNumber, studentPhoto, pendingPhoto])

  const clearClientError = (key) => {
    setError('')
    setSuccess('')
    setClientErrors((prev) => {
      if (!prev?.[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large (max 5 MB).')
      setSuccess('')
      event.target.value = ''
      return
    }

    setError('')
    setSuccess('')

    const reader = new FileReader()
    const input = event.target
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const [, base64Part] = result.split(',')
        setPendingPhoto({
          name: file.name,
          type: file.type,
          base64: base64Part || result,
          preview: result,
        })
      }
      if (input) {
        input.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return

    const trimmedFirst = firstName.trim()
    const trimmedLast = lastName.trim()
    const trimmedPhone = phone.trim()
    const trimmedPlace = placeOfBirth.trim()
    const trimmedCountry = countryOfBirth.trim()
    const trimmedDocument = identificationDocument.trim()
    const trimmedNumber = documentNumber.trim()
    const trimmedNationality = nationality.trim()

    const fieldErrors = {}
    if (!trimmedPlace) fieldErrors.place_birth = 'Place of birth is required'
    if (!trimmedCountry) fieldErrors.country_birth = 'Country of birth is required'
    if (!trimmedDocument || !IDENTIFICATION_DOCUMENT_OPTIONS.includes(trimmedDocument)) {
      fieldErrors.identification_document = 'Please select an identification document'
    }
    if (!trimmedNumber) fieldErrors.document_number = 'Document number is required'

    if (Object.keys(fieldErrors).length) {
      setClientErrors(fieldErrors)
      return
    }

    if (!isValid) return

    setLoading(true)
    setError('')
    setSuccess('')
    setClientErrors({})

    const payload = {
      first_name: trimmedFirst,
      last_name: trimmedLast,
      phone: trimmedPhone || undefined,
      date_of_birth: dateOfBirth || undefined,
      nationality: trimmedNationality || undefined,
      place_birth: trimmedPlace,
      country_birth: trimmedCountry,
      identification_document: trimmedDocument,
      document_number: trimmedNumber,
    }

    if (pendingPhoto?.base64) {
      payload.student_photo_upload = {
        filename: pendingPhoto.name,
        contentType: pendingPhoto.type,
        base64: pendingPhoto.base64,
      }
    }

    try {
      const response = await updateStudentProfile(payload)
      const updatedFields = response?.fields || {}
      const nextPhoto = Array.isArray(updatedFields.student_photo)
        ? updatedFields.student_photo
        : studentPhoto

      setFirstName(payload.first_name)
      setLastName(payload.last_name)
      setPhone(payload.phone || '')
      setDateOfBirth(payload.date_of_birth || '')
      setNationality(trimmedNationality)
      setPlaceOfBirth(payload.place_birth)
      setCountryOfBirth(payload.country_birth)
      setIdentificationDocument(payload.identification_document)
      setDocumentNumber(payload.document_number)
      setStudentPhoto(nextPhoto)
      setPendingPhoto(null)
      setClientErrors({})
      setSuccess('Changes saved successfully!')

      const nextBaseline = {
        firstName: payload.first_name,
        lastName: payload.last_name,
        email,
        phone: payload.phone || '',
        dateOfBirth: payload.date_of_birth || '',
        nationality: trimmedNationality,
        placeOfBirth: payload.place_birth,
        countryOfBirth: payload.country_birth,
        identificationDocument: payload.identification_document,
        documentNumber: payload.document_number,
        studentPhoto: nextPhoto,
      }
      setInternalBaseline(nextBaseline)

      if (typeof onProfileUpdated === 'function') {
        try {
          await onProfileUpdated()
        } catch (refreshError) {
          console.error('Unable to refresh current user', refreshError)
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to save changes')
      } else {
        console.error('updateStudentProfile failed', err)
        setError('Unable to save changes. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="lg:w-72">
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <div className="mb-4 h-40 w-40 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
            {displayPhotoUrl ? (
              <img src={displayPhotoUrl} alt="Student portrait" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                No photo
              </div>
            )}
          </div>
          <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-xl border border-binavy/30 px-4 py-2 text-sm font-medium text-primary transition hover:bg-binavy/5">
            Upload new photo
            <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
          </label>
          <p className="mt-2 text-xs text-slate-500">Accepted formats: JPG, PNG. Max 5 MB.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 space-y-6" noValidate>
        <div>
          <h2 className="text-2xl font-semibold text-primary">Personal details</h2>
          <p className="mt-1 text-sm text-secondary">
            Keep your personal information up to date to help your school support you.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value)
                clearClientError('first_name')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value)
                clearClientError('last_name')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                clearClientError('phone')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            />
            <p className="mt-1 text-xs text-slate-500">Optional, 7-20 digits.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Date of birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) => {
                setDateOfBirth(event.target.value)
                clearClientError('date_of_birth')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Nationality</label>
            <NationalitySelect
              value={nationality}
              onChange={(value) => {
                setNationality(value)
                clearClientError('nationality')
              }}
              disabled={loading}
              name="nationality"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Place of birth</label>
            <input
              type="text"
              value={placeOfBirth}
              onChange={(event) => {
                setPlaceOfBirth(event.target.value)
                clearClientError('place_birth')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            />
            {clientErrors.place_birth && (
              <p className="mt-1 text-xs text-red-600">{clientErrors.place_birth}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Country of birth</label>
            <input
              type="text"
              value={countryOfBirth}
              onChange={(event) => {
                setCountryOfBirth(event.target.value)
                clearClientError('country_birth')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            />
            {clientErrors.country_birth && (
              <p className="mt-1 text-xs text-red-600">{clientErrors.country_birth}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Identification document</label>
            <select
              value={identificationDocument}
              onChange={(event) => {
                setIdentificationDocument(event.target.value)
                clearClientError('identification_document')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            >
              <option value="">Select document</option>
              {IDENTIFICATION_DOCUMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {clientErrors.identification_document && (
              <p className="mt-1 text-xs text-red-600">{clientErrors.identification_document}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Document number</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(event) => {
                setDocumentNumber(event.target.value)
                clearClientError('document_number')
              }}
              disabled={loading}
              className="mt-1 w-full rounded-xl border border-binavy/30 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-binavy/30"
            />
            {clientErrors.document_number && (
              <p className="mt-1 text-xs text-red-600">{clientErrors.document_number}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary inline-flex items-center justify-center px-6 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || !isDirty || !isValid}
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
