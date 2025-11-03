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
    const token = localStorage.getItem('token')
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
  } catch (error) {
    data = null
  }

  if (!response.ok) {
    const message = data?.error || 'Server error. Please try again later.'
    throw new ApiError(message, response.status, data)
  }

  return data
}

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

export function persistSession({
  token,
  role,
  id,
  name,
  schoolId,
  schoolName,
  schoolCode,
}) {
  if (token) {
    localStorage.setItem('token', token)
  } else {
    localStorage.removeItem('token')
  }
  if (role) {
    localStorage.setItem('role', role)
  } else {
    localStorage.removeItem('role')
  }

  if (name) {
    localStorage.setItem('name', name)
  } else {
    localStorage.removeItem('name')
  }

  if (id) {
    localStorage.setItem('id', id)
  } else {
    localStorage.removeItem('id')
  }

  if (schoolId !== undefined && schoolId !== null) {
    localStorage.setItem('schoolId', schoolId)
  } else {
    localStorage.removeItem('schoolId')
  }

  if (schoolName) {
    localStorage.setItem('schoolName', schoolName)
  } else {
    localStorage.removeItem('schoolName')
  }

  if (schoolCode) {
    localStorage.setItem('schoolCode', schoolCode)
  } else {
    localStorage.removeItem('schoolCode')
  }
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('name')
  localStorage.removeItem('id')
  localStorage.removeItem('schoolId')
  localStorage.removeItem('schoolName')
  localStorage.removeItem('schoolCode')
}

export function getStoredSession() {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  const id = localStorage.getItem('id')
  const name = localStorage.getItem('name')
  const schoolId = localStorage.getItem('schoolId')
  const schoolName = localStorage.getItem('schoolName')
  const schoolCode = localStorage.getItem('schoolCode')
  return { token, role, id, name, schoolId, schoolName, schoolCode }
}

export function getDashboardPath(role) {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'school':
      return '/school'
    case 'student':
      return '/student'
    default:
      return '/'
  }
}

export function buildAuthHeaders(headers = {}) {
  const token = localStorage.getItem('token')
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
