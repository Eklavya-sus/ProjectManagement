// app/dashboard/projects/[id]/page.js
import { getOrganization } from '@/lib/dal'
import { ProjectHeader } from './components/ProjectHeader'
import { TaskBoard } from './components/TaskBoard'
import { ProjectMembersPanel } from './components/ProjectMembersPanel'
import { ActivityLog } from './components/ActivityLog'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/dal'

async function getProjectDetails(projectId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    return data.project
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

async function getProjectTasks(projectId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const data = await response.json()
    return data.tasks || []
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

export default async function ProjectDetailPage({ params }) {
  const { id: projectId } = await params
  const org = await getOrganization()
  const user = await getUser()
  
  if (!org?.id) {
    redirect('/dashboard')
  }

  // Get token and fetch project data
  const { verifySession } = await import('@/lib/dal')
  const token = await verifySession()
  
  const [project, tasks] = await Promise.all([
    getProjectDetails(projectId, token),
    getProjectTasks(projectId, token)
  ])

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-gray-600">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }
  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo'),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    review: tasks.filter(task => task.status === 'review'),
    done: tasks.filter(task => task.status === 'done')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Project Header */}
      <ProjectHeader project={project} token={token} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Task Board */}
          <div className="lg:col-span-3">
            <TaskBoard 
              project={project} 
              tasksByStatus={tasksByStatus} 
              token={token}
              user={user}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Members */}
            <ProjectMembersPanel 
              project={project} 
              orgId={org.id} 
              token={token} 
            />

            {/* Pure client-side activity log */}
            <ActivityLog 
              projectId={projectId}
              orgId={org.id}
              token={token}
            />
          </div>
        </div>
      </div>
    </div>
  )
}