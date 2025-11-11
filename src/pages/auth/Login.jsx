import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const [params] = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') || 'student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      // login deve restituire la risposta JSON: { token, role, id, name, ... }
      const data = await login({ email, password, mode })

      if (!data || !data.token) {
        throw new Error('Missing token in login response')
      }

      // ✅ Salvo davvero token e identificativi
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('userId', data.id || '')
      localStorage.setItem('userEmail', email)

      // redirect in base al ruolo (o selezione)
      const role = data.role || mode
      if (role === 'admin') nav('/admin')
      else if (role === 'school') nav('/school')
      else nav('/student')
    } catch (e) {
      console.error('Login failed:', e)
      setError('Invalid credentials or server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='max-w-md mx-auto p-6 rounded-2xl border mt-6 bg-white'>
      <h1 className='text-xl font-semibold mb-4'>Login</h1>

      <label className='block text-sm mb-1'>Role</label>
      <select
        value={mode}
        onChange={(event) => setMode(event.target.value)}
        className='w-full mb-3 border rounded-lg p-2'
      >
        <option value='admin'>Admin</option>
        <option value='school'>School</option>
        <option value='student'>Student</option>
      </select>

      <input
        placeholder='Email'
        className='w-full mb-2 border rounded-lg p-2'
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <input
        placeholder='Password'
        type='password'
        className='w-full mb-4 border rounded-lg p-2'
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error && (
        <div className='mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700'>
          {error}
        </div>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        className='w-full rounded-lg bg-binavy text-white py-2 disabled:opacity-60'
      >
        {loading ? 'Logging in…' : 'Log in'}
      </button>
    </div>
  )
}
