import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className='grid md:grid-cols-5 gap-4 mt-6'>
      <aside className='md:col-span-1'>
        <div className='sticky top-20 space-y-1'>
          <NavLink
            to='/admin'
            end
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg transition hover:bg-slate-100 ${isActive ? 'bg-slate-100 font-semibold' : ''}`
            }
          >
            Overview
          </NavLink>
          <NavLink
            to='/admin/analytics'
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg transition hover:bg-slate-100 ${isActive ? 'bg-slate-100 font-semibold' : ''}`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to='/admin/schools'
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg transition hover:bg-slate-100 ${isActive ? 'bg-slate-100 font-semibold' : ''}`
            }
          >
            Schools &amp; OTPs
          </NavLink>
        </div>
      </aside>
      <main className='md:col-span-4'>
        <Outlet />
      </main>
    </div>
  )
}
