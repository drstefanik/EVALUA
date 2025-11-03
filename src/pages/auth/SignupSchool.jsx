import React, { useState } from 'react'
import { at } from '../../lib/airtable.js'

function genCode(name) {
  const norm = name.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const part = norm.slice(0, 3) || 'SCH'
  const rnd = Math.floor(1000 + Math.random() * 9000)
  return `${part}-${rnd}`
}

export default function SignupSchool() {
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [res, setRes] = useState(null)

  const submit = async () => {
    const otps = import.meta.env.VITE_AT_TABLE_SCHOOL_OTPS
    const r = await at.list(otps, { filterByFormula: `{otp_code} = '${otp}'` })
    const rec = r.records?.[0]
    if (!rec) return setRes('Invalid OTP')
    const code = genCode(name)
    const sTbl = import.meta.env.VITE_AT_TABLE_SCHOOLS
    await at.create(sTbl, {
      name,
      code,
      email,
      password_hash: password,
      status: 'active',
    })
    setRes(`School registered. School Code: ${code}`)
  }

  return (
    <div className='max-w-md mx-auto p-6 rounded-2xl border mt-6 bg-white'>
      <h1 className='text-xl font-semibold mb-4'>School registration (with OTP)</h1>
      <input
        placeholder='OTP'
        className='w-full mb-2 border rounded-lg p-2'
        value={otp}
        onChange={(event) => setOtp(event.target.value)}
      />
      <input
        placeholder='School name'
        className='w-full mb-2 border rounded-lg p-2'
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input
        placeholder='Contact email'
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
      <button onClick={submit} className='w-full rounded-lg bg-binavy text-white py-2'>
        Create school account
      </button>
      {res && <p className='text-sm mt-3'>{res}</p>}
    </div>
  )
}
