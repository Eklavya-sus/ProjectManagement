import { getOrganization, getUser } from '@/lib/dal'
import { InviteButton } from './components/InviteButton'
import { InvitesTable } from './components/InvitesTable'

async function getOrganizationDetails(orgId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/org/${orgId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch organization details')
    }

    const data = await response.json()
    return data.organization
  } catch (error) {
    console.error('Error fetching organization:', error)
    return null
  }
}

async function getOrganizationUsers(orgId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/org/${orgId}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organization users');
    }

    const data = await response.json();
    return data.users; 
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export default async function SettingsPage() {
  const org = await getOrganization()
  const user = await getUser()
  const userRole = user.role
  
  if (!org?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Organization Found</h1>
          <p className="text-gray-600">You don't belong to any organization.</p>
        </div>
      </div>
    )
  }

  // Get token from dal and fetch organization details
  const { verifySession } = await import('@/lib/dal')
  const token = await verifySession()
  const organization = await getOrganizationDetails(org.id, token)
  const users = await getOrganizationUsers(org.id, token)

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Organization</h1>
          <p className="text-gray-600">Unable to load organization details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-2 text-gray-600">Manage your organization information</p>
        </div>

        {/* Organization Info Card */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Organization Details</h2>
          </div>
          
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Organization Name */}
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Organization Name</dt>
                <dd className="text-lg text-gray-900">{organization.name}</dd>
              </div>

              {/* Created Date */}
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Created Date</dt>
                <dd className="text-lg text-gray-900">
                  {new Date(organization.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>

              {/* Admin Name */}
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Administrator</dt>
                <dd className="text-lg text-gray-900">{organization.admin.name}</dd>
              </div>

              {/* Admin Email */}
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Admin Email</dt>
                <dd className="text-lg text-gray-900">{organization.admin.email}</dd>
              </div>

              {/* Last Updated */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-1">Last Updated</dt>
                <dd className="text-lg text-gray-900">
                  {new Date(organization.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white shadow rounded-lg mt-8">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Organization Members</h2>
            {
              userRole === "admin" && (
                <InviteButton orgId={org.id} token={token} />
              )
            }
          </div>
          <div className="px-6 py-6 overflow-x-auto">
            {users.length === 0 ? (
              <p className="text-gray-600">No members found in this organization.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 capitalize">{user.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Invites Table */}
        {
          userRole === "admin" && (
          <InvitesTable orgId={org.id} token={token} />
        )}
      </div>
    </div>
  )
}