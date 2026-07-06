// app/dashboard/tasks/[id]/edit/page.js
import { getOrganization, getUser, verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { TaskEditForm } from './components/TaskEditForm'

async function getTaskDetails(taskId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.task
  } catch (error) {
    console.error('Error fetching task:', error)
    return null
  }
}

async function getOrganizationUsers(orgId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/organizations/${orgId}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    return data.users || []
  } catch (error) {
    console.error('Error fetching organization users:', error)
    return []
  }
}
async function getProjectDetails(projectId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    console.log(response)
    const data = await response.json()
    console.log(data)
    return data.project
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

export default async function TaskEditPage({ params }) {
  const { id: taskId } = await params
  const org = await getOrganization()
  
  if (!org?.id) {
    redirect('/dashboard')
  }

  // Get token and fetch data
  const token = await verifySession()
  console.log(token)
  const [task, orgUsers] = await Promise.all([
    getTaskDetails(taskId, token),
    getOrganizationUsers(org.id, token)
  ])

  const project= await getProjectDetails(task.project._id, token);
  console.log(project)

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h1>
          <p className="text-gray-600 mb-6">The task you're looking for doesn't exist or you don't have access to it.</p>
          <a 
            href="/dashboard" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <nav className="flex space-x-4 text-sm text-gray-500 mb-2">
                <a href="/dashboard" className="hover:text-gray-700">Dashboard</a>
                <span>/</span>
                <a href={`/dashboard/projects/${task.project._id}`} className="hover:text-gray-700">
                  {task.project.name}
                </a>
                <span>/</span>
                <span className="text-gray-900">Edit Task</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">
                Edit Task: {task.title}
              </h1>
            </div>
            <div className="flex space-x-3">
              <a
                href={`/dashboard/projects/${task.project._id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-6">
            <TaskEditForm 
              task={task} 
              token={token}
              projectMembers={project.members}
            />
          </div>
        </div>
      </div>
    </div>
  )
}