// components/dashboard/StatsCards.js
import { verifySession } from "@/lib/dal"
import { getOrganization } from "@/lib/dal"

async function getOrganizationUsers(orgId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/org/${orgId}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(response)
    if (!response.ok) {
      throw new Error('Failed to fetch organization users');
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

async function getOrganizationProjects(orgId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/${orgId}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(response)
    if (!response.ok) {
      throw new Error('Failed to fetch organization projects');
    }

    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export default async function StatsCards() {
  const org = await getOrganization();
  const token = await verifySession();
  console.log("org is", org)
  
  const users = await getOrganizationUsers(org.id, token);
  const projects = await getOrganizationProjects(org.id, token);
  
  console.log(users.users?.length);
  console.log(projects.projects?.length)
  
  // Use actual API data
  const stats = [
    {
      name: 'Total Projects',
      value: projects.projects?.length?.toString() || '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      name: 'Team Members',
      value: users.users?.length?.toString() || '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
        >
          <div>
            <div className="absolute bg-indigo-500 rounded-md p-3">
              <span className="text-white">{stat.icon}</span>
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 truncate">
              {stat.name}
            </p>
          </div>
          <div className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}