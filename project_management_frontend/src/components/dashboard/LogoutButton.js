// components/dashboard/LogoutButton.js
'use client'
import { logout } from '@/lib/actions/auth'

export default function LogoutButton() {
  return (
    <form action={logout} className="w-full">
      <button
        type="submit"
        className="w-full text-left px-0 py-1 text-sm text-red-600 hover:text-red-800 transition-colors duration-150"
      >
        Sign out
      </button>
    </form>
  )
}