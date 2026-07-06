// lib/actions/tasks.js
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreateTaskSchema = z.object({
  title: z.string().min(2, { message: 'Task title must be at least 2 characters long.' }).trim(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
})

export async function createTask(formData, projectId, token) {
  // 1. Validate form fields
  const validatedFields = CreateTaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    assignedTo: formData.get('assignedTo'),
    dueDate: formData.get('dueDate'),
    status: formData.get('status'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { title, description, priority, assignedTo, dueDate, status } = validatedFields.data

  try {
    // 2. Call backend API
    const response = await fetch(`${process.env.API_URL}/api/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        title, 
        description: description || undefined,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        status
      }),
    })
    console.log(response)
    const data = await response.json()
    if (!response.ok) {
      return {
        message: data.message || 'Failed to create task',
      }
    }

    // 3. Revalidate the project page
    revalidatePath(`/dashboard/projects/${projectId}`)
    
    return { success: true }

  } catch (error) {
    console.error('Task creation error:', error)
    return {
      message: 'An error occurred while creating the task.',
    }
  }
}

export async function updateTaskStatus(taskId, status, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/tasks/${taskId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        message: data.message || 'Failed to update task status',
      }
    }

    revalidatePath('/dashboard/projects')
    return { success: true }

  } catch (error) {
    console.error('Task status update error:', error)
    return {
      message: 'An error occurred while updating the task status.',
    }
  }
}

export async function updateTask(taskId, formData, token) {
  // 1. Validate form fields
  const validatedFields = CreateTaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    assignedTo: formData.get('assignedTo'),
    dueDate: formData.get('dueDate'),
    status: formData.get('status'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { title, description, priority, assignedTo, dueDate, status } = validatedFields.data

  try {
    const response = await fetch(`${process.env.API_URL}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        title, 
        description: description || undefined,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        status
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        message: data.message || 'Failed to update task',
      }
    }

    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard/tasks')
    return { success: true }

  } catch (error) {
    console.error('Task update error:', error)
    return {
      message: 'An error occurred while updating the task.',
    }
  }
}

export async function deleteTask(taskId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        message: data.message || 'Failed to delete task',
      }
    }

    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard/tasks')
    return { success: true }

  } catch (error) {
    console.error('Task deletion error:', error)
    return {
      message: 'An error occurred while deleting the task.',
    }
  }
}

export async function assignTask(taskId, userId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/tasks/${taskId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        message: data.message || 'Failed to assign task',
      }
    }

    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard/tasks')
    return { success: true }

  } catch (error) {
    console.error('Task assignment error:', error)
    return {
      message: 'An error occurred while assigning the task.',
    }
  }
}