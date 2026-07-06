// components/dashboard/UserMenu.js
'use client'
import { useState } from 'react'
import LogoutButton from './LogoutButton'

export default function UserMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="sr-only">Open user menu</span>
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <span className="hidden md:ml-3 md:block text-gray-700 text-sm font-medium">
            {user?.name}
          </span>
          <svg className="hidden md:ml-2 md:block h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          
          {/* Menu */}
          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
              Signed in as<br />
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            
            <a href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              Settings
            </a>
            
            <div className="border-t border-gray-100">
              <div className="px-4 py-2">
                <LogoutButton />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}