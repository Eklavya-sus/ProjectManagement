import React from 'react';
import { AcceptInviteForm } from '../components/AcceptInviteForm';

async function validateInviteToken(token) {
  try {
    const response = await fetch(`${process.env.API_URL}/api/org/invite/validate/${token}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

export default async function AcceptInvitePage({ params: awaitedParams }) {
  const params = await awaitedParams; 
  const token = params.token;
  const inviteData = await validateInviteToken(token);
  console.log(inviteData);

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invite</h1>
          <p className="text-gray-600">This invite link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join {inviteData.organizationName}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You've been invited to join as a member
          </p>
        </div>
        
        <AcceptInviteForm 
          token={params.token} 
          email={inviteData.email} 
          organizationName={inviteData.organizationName}
        />
      </div>
    </div>
  );
}