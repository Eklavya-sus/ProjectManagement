// app/dashboard/projects/[id]/components/ProjectMembersPanel.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function ProjectMembersPanel({ project, orgId, token }) {
  console.log(project)
  const [orgMembers, setOrgMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchOrgMembers()
  }, [])

  const fetchOrgMembers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/org/${orgId}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log(data)
        setOrgMembers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching org members:', error)
    }
  }

  const addMember = async (memberId) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId }),
      })
      console.log(response)
      if (response.ok) {
        setShowAddMember(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding member:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (memberId) => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error removing member:', error)
    } finally {
      setLoading(false)
    }
  }

  console.log(orgMembers)

  // Get available members (org members not already in project)
  const availableMembers = orgMembers.filter(
    orgMember => !project.members?.some(projectMember => projectMember._id === orgMember._id)
  )

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Project Members</h3>
        {availableMembers.length > 0 && (
          <button
            onClick={() => setShowAddMember(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Current Members */}
        <div className="space-y-3">
          {project.members?.length === 0 ? (
            <p className="text-gray-500 text-sm">No members assigned to this project</p>
          ) : (
            project.members?.map((member) => {
              const isCreator = member._id === project.createdBy._id
              return (
                <div key={member._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>

                  {!isCreator && (
                    <button
                      onClick={() => removeMember(member._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
                      title="Remove member"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Project Member</h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {availableMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm">All organization members are already part of this project</p>
                ) : (
                  availableMembers.map((member) => (
                    <div key={member._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => addMember(member._id)}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
