// lib/session.js
import 'server-only'
import { cookies } from 'next/headers'

const SESSION_KEY = 'session'

export async function createSession(token) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_KEY, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_KEY)?.value || null
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_KEY)
}
