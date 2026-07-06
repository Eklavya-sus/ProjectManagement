// app/dashboard/projects/[id]/components/TaskBoard.js
'use client'

import { useState } from 'react'
import { CreateTaskButton } from './CreateTaskButton'
import { TaskCard } from './TaskCard'

export function TaskBoard({ project, tasksByStatus, token, user }) {
  const [filter, setFilter] = useState('all')

  const columns = [
    { key: 'todo', title: 'To Do', color: 'bg-gray-50 border-gray-200' },
    { key: 'in_progress', title: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { key: 'review', title: 'Review', color: 'bg-yellow-50 border-yellow-200' },
    { key: 'done', title: 'Done', color: 'bg-green-50 border-green-200' }
  ]

  const filteredTasksByStatus = Object.keys(tasksByStatus).reduce((acc, status) => {
    acc[status] = tasksByStatus[status].filter(task => {
        console.log("user is ",user.id)
      if (filter === 'all') return true
      if (filter === 'my-tasks') return task.assignedTo?._id === user.id // You might need to pass current user
      if (filter === 'unassigned') return !task.assignedTo
      return task.priority === filter
    })
    return acc
  }, {})

  return (
    <div>
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Task Board</h2>
          <p className="text-gray-600">Manage and track project tasks</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tasks</option>
            <option value="my-tasks">My Tasks</option>
            <option value="unassigned">Unassigned</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <CreateTaskButton projectId={project.id} token={token} />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.key} className={`rounded-lg border-2 border-dashed ${column.color} p-4`}>
            {/* Column Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                {filteredTasksByStatus[column.key]?.length || 0}
              </span>
            </div>

            {/* Tasks */}
            <div className="space-y-3">
              {filteredTasksByStatus[column.key]?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                </div>
              ) : (
                filteredTasksByStatus[column.key]?.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    projectId={project.id}
                    token={token} 
                  />
                ))
              )}
            </div>

            {/* Quick Add Task (only for Todo column) */}
            {column.key === 'todo' && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <CreateTaskButton 
                  projectId={project.id} 
                  token={token} 
                  variant="minimal"
                  defaultStatus="todo"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Task Summary */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {columns.map((column) => {
            const count = tasksByStatus[column.key]?.length || 0
            const percentage = tasksByStatus.todo.length + tasksByStatus.in_progress.length + tasksByStatus.review.length + tasksByStatus.done.length > 0 
              ? Math.round((count / (tasksByStatus.todo.length + tasksByStatus.in_progress.length + tasksByStatus.review.length + tasksByStatus.done.length)) * 100)
              : 0

            return (
              <div key={column.key} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-500">{column.title}</div>
                <div className="text-xs text-gray-400">{percentage}%</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}