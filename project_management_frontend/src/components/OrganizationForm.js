'use client'

import { useActionState } from 'react'
import { createOrganization } from '@/lib/actions/auth'

export default function OrganizationForm() {
  const [state, action, pending] = useActionState(createOrganization, undefined)

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Organization Name *
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            required
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter organization name"
          />
          {state?.errors?.name && (
            <p className="mt-2 text-sm text-red-600">{state.errors.name}</p>
          )}
        </div>
      </div>

      {state?.message && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{state.message}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Creating organization...' : 'Create organization'}
        </button>
      </div>
    </form>
  )
}