'use client';

import React, { useState } from 'react';
import { InviteModal } from './InviteModal';

export function InviteButton({ orgId, token }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Invite Member
      </button>
      
      <InviteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        orgId={orgId}
        token={token}
      />
    </>
  );
}