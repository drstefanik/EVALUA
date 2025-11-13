// src/pages/auth/SignupStudent.jsx
import React, { useState } from 'react'
import { at } from '../../lib/airtable.js'

export default function SignupStudent() {
  const uTbl = import.meta.env.VITE_AT_TABLE_STUDENTS

  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dateOfBirth, setDob] = useState('')
  const [nationality, setNationality] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [countryOfBirth, setCountryOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [identificationDocument, setIdentificationDocument] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [res, setRes] = useState(null)

  const submit = async () => {
    setRes(null)
    if (!first || !last || !email || !password) return setRes('Missing required fields')
    if (!placeOfBirth || !countryOfBirth || !identificationDocument || !documentNumber) {
      return setRes('Missing required document details')
    }

    await at.create(uTbl, {
      first_name: first,
      last_name: last,
      email,
      password_hash: password, // solo per test manuali
      status: 'active',
      date_of_birth: dateOfBirth || null,
      nationality: nationality || '',
      phone: phone || '',
      place_birth: placeOfBirth,
      country_birth: countryOfBirth,
      identification_document: identificationDocument,
      document_number: documentNumber,
    })
    setRes('Student account created. You can log in now.')
  }

  return (
    <div className='max-w-md mx-auto p-6 rounded-2xl border mt-6 bg-white'>
      <h1 className='text-xl font-semibold mb-4'>Student registration</h1>

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
      <div className='grid grid-cols-2 gap-2 mt-2'>
        <input placeholder='Place of birth' className='border rounded-lg p-2' value={placeOfBirth} onChange={(e)=>setPlaceOfBirth(e.target.value)} />
        <input placeholder='Country of birth' className='border rounded-lg p-2' value={countryOfBirth} onChange={(e)=>setCountryOfBirth(e.target.value)} />
      </div>
      <input placeholder='Phone' className='w-full mt-2 border rounded-lg p-2' value={phone} onChange={(e)=>setPhone(e.target.value)} />
      <div className='grid grid-cols-2 gap-2 mt-2'>
        <input placeholder='Identification document' className='border rounded-lg p-2' value={identificationDocument} onChange={(e)=>setIdentificationDocument(e.target.value)} />
        <input placeholder='Document number' className='border rounded-lg p-2' value={documentNumber} onChange={(e)=>setDocumentNumber(e.target.value)} />
      </div>

      <button onClick={submit} className='w-full rounded-lg bg-binavy text-white py-2 mt-4'>Create account</button>
      {res && <p className='text-sm mt-3'>{res}</p>}
    </div>
  )
}
