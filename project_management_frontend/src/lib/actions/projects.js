// lib/actions/projects.js
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreateProjectSchema = z.object({
  name: z.string().min(2, { message: 'Project name must be at least 2 characters long.' }).trim(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional(),
})

export async function createProject(formData, orgId, token) {
  // 1. Validate form fields
  const validatedFields = CreateProjectSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    dueDate: formData.get('dueDate'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name, description, priority, dueDate } = validatedFields.data

  try {
    // 2. Call backend API
    const response = await fetch(`${process.env.API_URL}/api/${orgId}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        name, 
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined
      }),
    })
    console.log(response)
    const data = await response.json()

    if (!response.ok) {
      return {
        message: data.message || 'Failed to create project',
      }
    }

    // 3. Revalidate the projects page
    revalidatePath('/dashboard/projects')
    
    return { success: true }

  } catch (error) {
    console.error('Project creation error:', error)
    return {
      message: 'An error occurred while creating the project.',
    }
  }
}

export async function updateProjectStatus(projectId, status, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/projects/${projectId}/status`, {
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
        message: data.message || 'Failed to update project status',
      }
    }

    revalidatePath('/dashboard/projects')
    return { success: true }

  } catch (error) {
    console.error('Project status update error:', error)
    return {
      message: 'An error occurred while updating the project status.',
    }
  }
}

export async function deleteProject(projectId, token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const data = await response.json()
      return {
        message: data.message || 'Failed to delete project',
      }
    }

    revalidatePath('/dashboard/projects')
    return { success: true }

  } catch (error) {
    console.error('Project deletion error:', error)
    return {
      message: 'An error occurred while deleting the project.',
    }
  }
}