// app/dashboard/projects/components/ProjectCard.js
import Link from 'next/link'

export function ProjectCard({ project }) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }

  const statusColors = {
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    if (!date) return 'No due date'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'completed'

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <div className="p-6">
          {/* Header with status and priority */}
          <div className="flex justify-between items-start mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[project.priority]}`}>
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </span>
          </div>

          {/* Project name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {project.name}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {project.description}
            </p>
          )}

          {/* Due date */}
          <div className="mb-4">
            <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              Due: {formatDate(project.dueDate)}
              {isOverdue && ' (Overdue)'}
            </p>
          </div>

          {/* Members count */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{project.memberCount || 0} member{project.memberCount !== 1 ? 's' : ''}</span>
            <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}