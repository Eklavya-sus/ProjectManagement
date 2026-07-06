// components/dashboard/TopBar.js
import UserMenu from './UserMenu'

export default function TopBar({ user }) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
      {/* Mobile menu button - you can add this later */}
      <button className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden">
        <span className="sr-only">Open sidebar</span>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Left side - breadcrumbs or search can go here */}
      <div className="flex-1 px-4 flex justify-between items-center md:px-6">
        <div className="flex-1 flex">
          {/* Future: Add breadcrumbs or search */}
        </div>

        {/* Right side - user menu */}
        <div className="ml-4 flex items-center md:ml-6 space-x-4">
          

          {/* User menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </div>
  )
}