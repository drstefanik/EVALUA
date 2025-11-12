// src/pages/auth/SignupStudent.jsx
import React, { useEffect, useState } from 'react'
import { at } from '../../lib/airtable.js'

export default function SignupStudent() {
  const sTbl = import.meta.env.VITE_AT_TABLE_SCHOOLS
  const uTbl = import.meta.env.VITE_AT_TABLE_STUDENTS

  const [schools, setSchools] = useState([])
  const [schoolId, setSchoolId] = useState('')

  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [dateOfBirth, setDob] = useState('')
  const [nationality, setNationality] = useState('')
  const [phone, setPhone] = useState('')

  const [res, setRes] = useState(null)

  useEffect(() => {
    (async () => {
      const r = await at.list(sTbl, {})
      const items = (r.records || []).map(rec => ({ id: rec.id, name: rec.fields?.Name || rec.fields?.name || 'School' }))
      setSchools(items)
    })()
  }, [sTbl])

  const submit = async () => {
    setRes(null)
    if (!schoolId) return setRes('Please select a school')
    if (!first || !last || !email || !password) return setRes('Missing required fields')

    await at.create(uTbl, {
      first_name: first,
      last_name: last,
      email,
      password_hash: password, // N.B. questa pagina "semplice" non hasha: da usare solo per prove interne
      school: [schoolId],
      status: 'active',
      date_of_birth: dateOfBirth || null,
      nationality: nationality || '',
      phone: phone || '',
    })
    setRes('Student account created. You can log in now.')
  }

  return (
    <div className='max-w-md mx-auto p-6 rounded-2xl border mt-6 bg-white'>
      <h1 className='text-xl font-semibold mb-4'>Student registration</h1>

      <label className='text-sm'>School</label>
      <select className='w-full mb-3 border rounded-lg p-2' value={schoolId} onChange={(e)=>setSchoolId(e.target.value)}>
        <option value=''>Select…</option>
        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <div className='grid grid-cols-2 gap-2'>
        <input placeholder='First name' className='border rounded-lg p-2' value={first} onChange={(e)=>setFirst(e.target.value)} />
        <input placeholder='Last name'  className='border rounded-lg p-2' value={last}  onChange={(e)=>setLast(e.target.value)} />
      </div>
      <input placeholder='Email' className='w-full mt-2 border rounded-lg p-2' value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input placeholder='Password' type='password' className='w-full mt-2 border rounded-lg p-2' value={password} onChange={(e)=>setPassword(e.target.value)} />

      <div className='grid grid-cols-2 gap-2 mt-2'>
        <input type='date' placeholder='YYYY-MM-DD' className='border rounded-lg p-2' value={dateOfBirth} onChange={(e)=>setDob(e.target.value)} />
        <input placeholder='Nationality' className='border rounded-lg p-2' value={nationality} onChange={(e)=>setNationality(e.target.value)} />
      </div>
      <input placeholder='Phone' className='w-full mt-2 border rounded-lg p-2' value={phone} onChange={(e)=>setPhone(e.target.value)} />

      <button onClick={submit} className='w-full rounded-lg bg-binavy text-white py-2 mt-4'>Create account</button>
      {res && <p className='text-sm mt-3'>{res}</p>}
    </div>
  )
}
