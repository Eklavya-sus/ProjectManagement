// app/dashboard/layout.js
import { requireOrganization, getUser, getOrganization } from '@/lib/dal'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { ApolloWrapper } from '@/components/ApolloWrapper'

export default async function DashboardLayout({ children }) {
  // This automatically handles auth and organization checks
  await requireOrganization()
  
  // Fetch data on the server
  const user = await getUser()
  const organization = await getOrganization()

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar organization={organization} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar user={user} />
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="h-full">
            <ApolloWrapper>
            {children}
            </ApolloWrapper>
          </div>
        </main>
      </div>
    </div>
  )
}