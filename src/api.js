const API = import.meta.env.VITE_AUTH_API ?? '/api'

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

  let response
  try {
    response = await fetch(`${API}${path}`, {
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

// -------- AUTH --------

export async function login({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function signupSchool({ name, email, password, otp_code }) {
  return request('/auth/signup-school', {
    method: 'POST',
    body: { name, email, password, otp_code },
  })
}

export async function signupStudent({ full_name, email, password, school_code }) {
  const body = { full_name, email, password, school_code }
  return request('/auth/signup-student', {
    method: 'POST',
    body,
  })
}

// -------- SESSION --------

export function persistSession({
  token,
  role,
  id,
  name,
  schoolId,
  schoolName,
  schoolCode,
}) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')

  if (role) localStorage.setItem('role', role)
  else localStorage.removeItem('role')

  if (name) localStorage.setItem('name', name)
  else localStorage.removeItem('name')

  if (id) localStorage.setItem('id', id)
  else localStorage.removeItem('id')

  if (schoolId) localStorage.setItem('schoolId', schoolId)
  else localStorage.removeItem('schoolId')

  if (schoolName) localStorage.setItem('schoolName', schoolName)
  else localStorage.removeItem('schoolName')

  if (schoolCode) localStorage.setItem('schoolCode', schoolCode)
  else localStorage.removeItem('schoolCode')
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
  localStorage.removeItem('binext_user')
  localStorage.removeItem('binext_role')
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
    const schoolId = localStorage.getItem('schoolId')
    const schoolName = localStorage.getItem('schoolName')
    const schoolCode = localStorage.getItem('schoolCode')

    if (!token && !role && !id && !name && !schoolId && !schoolName && !schoolCode) {
      return null
    }

    const session = { token, role, id, name, schoolId, schoolName, schoolCode }
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
  return request('/school/code', { method: 'GET', withAuth: true })
}

export async function fetchStudentsBySchool(code) {
  if (!code) {
    throw new Error('Missing school code')
  }

  return request(`/get-students-by-school?code=${encodeURIComponent(code)}`)
}

export async function fetchSchoolByCode(code) {
  if (!code) {
    throw new Error('Missing school code')
  }

  return request(`/get-school-by-code?code=${encodeURIComponent(code)}`)
}
