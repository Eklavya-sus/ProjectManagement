"use client";

import React, { useState, useEffect } from "react";

export function InvitesTable({ orgId, token }) {
  const [invites, setInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvites = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/org/invite/${orgId}`,{
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invites");
      }

      const data = await response.json();
      setInvites(data.invites);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeInvite = async (inviteId, token) => {
    if (!confirm("Are you sure you want to revoke this invite?")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/org/invite/${inviteId}`,
        {
          method: "DELETE",
          headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke invite");
      }

      // Refresh the invites list
      fetchInvites();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [orgId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-700 bg-yellow-100";
      case "accepted":
        return "text-green-700 bg-green-100";
      case "revoked":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg mt-8 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg mt-8">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Pending Invites</h2>
        <button
          onClick={fetchInvites}
          className="text-gray-500 hover:text-gray-700 transition-colors text-xl"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      <div className="px-6 py-6 overflow-x-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {invites.length === 0 ? (
          <p className="text-gray-600">No invites found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invited By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invites.map((invite) => (
                <tr key={invite.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {invite.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        invite.status
                      )}`}
                    >
                      {invite.status}
                      {invite.status === "pending" &&
                        isExpired(invite.expiresAt) &&
                        " (Expired)"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {invite.createdBy.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(invite.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {invite.status === "pending" &&
                      !isExpired(invite.expiresAt) && (
                        <button
                          onClick={() => revokeInvite(invite.id, token)}
                          className="text-red-600 hover:text-red-800 transition-colors text-lg"
                          title="Revoke invite"
                        >
                          delete
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
