// app/dashboard/page.js
import { getUser, getOrganization } from '@/lib/dal'
import { verifySession } from '@/lib/dal'
import StatsCards from '@/components/dashboard/StatsCards'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default async function DashboardPage() {
  const user = await getUser()
  const token = await verifySession()
  const organization = await getOrganization()
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, {user?.name}! Here's what's happening with {organization?.name}.
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8">
        <StatsCards />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <RecentActivity orgId={organization.id} token={token} showPagination={true}/>
        </div>
      </div>
    </div>
  )
}