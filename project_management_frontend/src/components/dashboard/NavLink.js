// components/dashboard/NavLink.js
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, children, icon }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`${
        isActive
          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors duration-150`}
    >
      <span className={`${
        isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
      } flex-shrink-0 mr-3 transition-colors duration-150`}>
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  )
}