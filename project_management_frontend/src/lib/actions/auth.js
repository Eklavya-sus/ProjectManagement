// lib/actions/auth.js
'use server'

import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'
import { getUser } from '@/lib/dal'
import { SignupFormSchema, OrganizationFormSchema, SigninFormSchema} from '../schemas/authSchema'

export async function signup(state, formData) {
  // 1. Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // If validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // 2. Prepare data for API call
  const { name, email, password } = validatedFields.data

  try {
    // 3. Call your backend API
    const response = await fetch(`${process.env.API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password , role:'admin'}),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        message: data.message || 'Registration failed',
      }
    }

    // 4. Create user session
    await createSession(data.token)

  } catch (error) {
    console.error('Registration error:', error)
    return {
      message: 'An error occurred during registration.',
    }
  }

  // 5. Redirect to organization creation
  redirect('/create-organization')
}

export async function signin(state, formData) {
  // 1. Validate form fields
  const validatedFields = SigninFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // If validation fails, return errors early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // 2. Prepare data for API call
  const { email, password } = validatedFields.data

  try {
    // 3. Call your backend API
    const response = await fetch(`${process.env.API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        message: data.message || 'Sign in failed',
      }
    }

    // 4. Create user session
    await createSession(data.token)

  } catch (error) {
    console.error('Login error:', error)
    return {
      message: 'An error occurred during signin.',
    }
  }

  // 5. Redirect to organization creation
  redirect('/dashboard')
}

export async function createOrganization(state, formData) {
  // First verify the user is authenticated
  const { verifySession } = await import('@/lib/dal')

  // Check if user already has an organization
  const user = await getUser()
  if (user?.organizationId) {
    redirect('/dashboard')
  }
  const token = await verifySession()

  // 1. Validate form fields
  const validatedFields = OrganizationFormSchema.safeParse({
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { name } = validatedFields.data;

  try {
    // 2. Call backend API to create organization
    const response = await fetch(`${process.env.API_URL}/api/org/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        message: data.message || 'Failed to create organization',
      }
    }
   const updatedUser = await getUser()
    console.log('User after org creation:', updatedUser)
  } catch (error) {
    console.error('Organization creation error:', error)
    return {
      message: 'An error occurred while creating the organization.',
    }
  }

  // 4. Redirect to dashboard
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/register')
}