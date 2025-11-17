const API_BASE = (import.meta.env.VITE_AUTH_API || '').replace(/\/$/, '')
const API_SUFFIX = '/api'

function buildApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!API_BASE) {
    return normalizedPath
  }

  if (normalizedPath.startsWith(API_BASE)) {
    return normalizedPath
  }

  if (
    API_BASE.endsWith(API_SUFFIX) &&
    (normalizedPath === API_SUFFIX || normalizedPath.startsWith(`${API_SUFFIX}/`))
  ) {
    const trimmedPath = normalizedPath.slice(API_SUFFIX.length) || ''
    return `${API_BASE}${trimmedPath}`
  }

  return `${API_BASE}${normalizedPath}`
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function buildHeaders(base = {}) {
  return {
    'Content-Type': 'application/json',
    ...base,
  }
}

async function request(path, { method = 'GET', body, headers = {}, withAuth = false } = {}) {
  const finalHeaders = buildHeaders(headers)
  if (withAuth) {
    // 🔄 Usa sempre authToken (nuovo) come priorità
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      null
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  const url = buildApiUrl(path)
  let response
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    throw new Error('Connection unavailable.')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.error || 'Server error. Please try again later.'
    throw new ApiError(message, response.status, data)
  }

  return data
}

const CURRENT_USER_KEY = 'currentUser'

function normalizeFeatures(features) {
  if (!features || typeof features !== 'object') return null
  return {
    courses: Boolean(features.courses),
    quaet: Boolean(features.quaet),
    results: Boolean(features.results),
    personal_details: Boolean(features.personal_details || features.personalDetails),
  }
}

export function getStoredCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.features) {
      parsed.features = normalizeFeatures(parsed.features)
    }
    return parsed
  } catch {
    return null
  }
}

export function persistCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY)
    return null
  }

  const existing = getStoredCurrentUser() || {}
  const next = { ...existing, ...user }

  if (user.features !== undefined) {
    next.features = normalizeFeatures(user.features)
  } else if (existing.features && !next.features) {
    next.features = existing.features
  }

  if (user.student_photo !== undefined) {
    next.student_photo = Array.isArray(user.student_photo)
      ? user.student_photo
      : []
  }

  Object.keys(next).forEach((key) => {
    if (next[key] === undefined) {
      delete next[key]
    }
  })

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(next))
  return next
}

// -------- AUTH --------

export async function login({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function loginAdmin({ email, password }) {
  return request('/api/auth/login-admin', {
    method: 'POST',
    body: { email, password },
  })
}

export async function fetchAdminAnalytics({ from, to } = {}) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)

  const query = params.toString()
  const path = query ? `/api/admin/analytics?${query}` : '/api/admin/analytics'

  return request(path, { withAuth: true })
}

export async function signupSchool({ name, email, password, otp_code }) {
  return request('/api/auth/signup-school', {
    method: 'POST',
    body: { name, email, password, otp_code },
  })
}

export async function signupStudent(payload) {
  const response = await fetch(buildApiUrl('/api/auth/signup-student'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const json = await response.json().catch(() => ({}))
    const error = new ApiError(json?.error || response.statusText, response.status, json)
    throw error
  }

  return response.json()
}

// -------- SESSION --------

export function persistSession({
  token,
  role,
  id,
  name,
  email,
  schoolId,
  schoolName,
  schoolCode,
  features,
}) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')

  if (role) localStorage.setItem('role', role)
  else localStorage.removeItem('role')

  if (name) localStorage.setItem('name', name)
  else localStorage.removeItem('name')

  if (id) localStorage.setItem('id', id)
  else localStorage.removeItem('id')

  if (email) {
    localStorage.setItem('userEmail', email)
    localStorage.setItem('email', email)
  } else {
    localStorage.removeItem('userEmail')
    localStorage.removeItem('email')
  }

  if (schoolId) localStorage.setItem('schoolId', schoolId)
  else localStorage.removeItem('schoolId')

  if (schoolName) localStorage.setItem('schoolName', schoolName)
  else localStorage.removeItem('schoolName')

  if (schoolCode) localStorage.setItem('schoolCode', schoolCode)
  else localStorage.removeItem('schoolCode')

  const normalizedRole = role ? String(role).toLowerCase() : null
  if (normalizedRole !== 'student') {
    persistCurrentUser(null)
    return
  }

  persistCurrentUser({
    id,
    name,
    email: email || localStorage.getItem('userEmail') || null,
    role: normalizedRole,
    schoolId,
    schoolName,
    schoolCode,
    features,
  })
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('name')
  localStorage.removeItem('id')
  localStorage.removeItem('schoolId')
  localStorage.removeItem('schoolName')
  localStorage.removeItem('schoolCode')

  // 🧹 Rimuovi anche i nuovi key introdotti da useAuth
  localStorage.removeItem('authToken')
  localStorage.removeItem('userId')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('email')
  localStorage.removeItem('binext_user')
  localStorage.removeItem('binext_role')
  localStorage.removeItem(CURRENT_USER_KEY)
}

/**
 * 🔍 Unified session getter
 * Supporta:
 *  - vecchi key (`token`, `role`, `id`, `name`, ecc.)
 *  - nuovi key (`authToken`, `binext_user`, `binext_role`)
 */
export function getStoredSession() {
  try {
    // ✅ Prima prova con i nuovi key
    const fakeUserRaw = localStorage.getItem('binext_user')
    const fakeRole = localStorage.getItem('binext_role')
    const fakeToken = localStorage.getItem('authToken')

    if (fakeUserRaw && fakeToken) {
      const user = JSON.parse(fakeUserRaw)
      return {
        token: fakeToken,
        role: fakeRole || user?.role || null,
        id: user?.id || localStorage.getItem('userId') || null,
        email: user?.email || localStorage.getItem('userEmail') || null,
        name: user?.name || null,
      }
    }

    // 🔙 Altrimenti fallback al formato classico
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken')
    const role =
      localStorage.getItem('role') || localStorage.getItem('binext_role')
    const id =
      localStorage.getItem('id') || localStorage.getItem('userId')
    const name = localStorage.getItem('name')
    const email = localStorage.getItem('email') || localStorage.getItem('userEmail')
    const schoolId = localStorage.getItem('schoolId')
    const schoolName = localStorage.getItem('schoolName')
    const schoolCode = localStorage.getItem('schoolCode')

    if (!token && !role && !id && !name && !email && !schoolId && !schoolName && !schoolCode) {
      return null
    }

    const session = { token, role, id, name, email, schoolId, schoolName, schoolCode }
    if (session.role && typeof session.role === 'string') {
      session.role = session.role.toLowerCase()
    }
    return session
  } catch {
    return null
  }
}

// -------- UTILITIES --------

export function getDashboardPath(role) {
  const r = String(role || '').toLowerCase()
  switch (r) {
    case 'student':
      return '/student'
    case 'school':
    case 'teacher':
      return '/school'
    case 'admin':
    case 'administrator':
      return '/admin'
    default:
      return '/dashboard'
  }
}

export function routeExists(pathname) {
  try {
    const links = Array.from(document.querySelectorAll('a[href]')).map((a) =>
      a.getAttribute('href')
    )
    return links.includes(pathname)
  } catch {
    return false
  }
}

export function buildAuthHeaders(headers = {}) {
  const token =
    localStorage.getItem('authToken') || localStorage.getItem('token')
  if (token) {
    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    }
  }
  return headers
}

export async function fetchSchoolCode() {
  return request('/api/school/code', { method: 'GET', withAuth: true })
}

export async function fetchStudentsBySchool(code) {
  if (!code) {
    throw new Error('Missing school code')
  }

  return request(`/api/get-students-by-school?code=${encodeURIComponent(code)}`)
}

export async function fetchSchoolByCode(code) {
  if (!code) {
    throw new Error('Missing school code')
  }

  return request(`/api/get-school-by-code?code=${encodeURIComponent(code)}`)
}

export async function fetchCurrentUser(params = {}) {
  const query = new URLSearchParams()
  if (params.id) query.set('id', params.id)
  if (params.email) query.set('email', params.email)
  const qs = query.toString()
  const url = `/api/get-current-user${qs ? `?${qs}` : ''}`
  return request(url, { method: 'GET', withAuth: true })
}

export async function refreshCurrentUser() {
  const session = getStoredSession()
  if (!session || !session.token) {
    persistCurrentUser(null)
    return null
  }

  const role = session.role ? String(session.role).toLowerCase() : null
  if (role !== 'student') {
    persistCurrentUser(null)
    return null
  }

  try {
    const data = await fetchCurrentUser({ id: session.id, email: session.email })
    const schoolField = Array.isArray(data?.school) ? data.school[0] : data?.school
    return persistCurrentUser({
      id: data?.id || session.id || null,
      recordId: data?.id || session.id || null,
      name: data?.name || session.name || null,
      email: data?.email || session.email || localStorage.getItem('userEmail') || null,
      role,
      schoolId: schoolField || session.schoolId || null,
      schoolName: session.schoolName || null,
      schoolCode: session.schoolCode || null,
      firstName: data?.firstName ?? data?.first_name ?? null,
      lastName: data?.lastName ?? data?.last_name ?? null,
      nationality: data?.nationality ?? null,
      dateOfBirth: data?.dateOfBirth ?? null,
      placeOfBirth: data?.placeOfBirth ?? data?.place_birth ?? null,
      countryOfBirth: data?.countryOfBirth ?? data?.country_birth ?? null,
      identificationDocument:
        data?.identificationDocument ?? data?.identification_document ?? null,
      documentNumber: data?.documentNumber ?? data?.document_number ?? null,
      phone: data?.phone ?? null,
      student_photo: Array.isArray(data?.student_photo) ? data.student_photo : [],
      features: data?.features,
    })
  } catch (error) {
    console.error('refreshCurrentUser failed', error)
    throw error
  }
}

export async function updateStudentProfile(payload) {
  return request('/api/student/update-profile', {
    method: 'PATCH',
    withAuth: true,
    body: payload,
  })
}
