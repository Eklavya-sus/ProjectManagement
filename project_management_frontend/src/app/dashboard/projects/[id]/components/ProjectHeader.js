// app/dashboard/projects/[id]/components/ProjectHeader.js
"use client";

import { useState } from "react";
import { updateProjectStatus, deleteProject } from "@/lib/actions/projects";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ProjectHeader({ project, token }) {
  console.log(project)
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const statusColors = {
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      const result = await updateProjectStatus(project.id, newStatus, token);
      if (result?.success) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const result = await deleteProject(project.id, token);
      if (result?.success) {
        router.push("/dashboard/projects");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isOverdue =
    project.dueDate &&
    new Date(project.dueDate) < new Date() &&
    project.status !== "completed";

  return (
    <div className="bg-white shadow border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link
                href="/dashboard/projects"
                className="text-gray-500 hover:text-gray-700"
              >
                Projects
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-900 font-medium">{project.name}</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-bold text-gray-900 mr-4">
                {project.name}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[project.status]
                }`}
              >
                {project.status.charAt(0).toUpperCase() +
                  project.status.slice(1)}
              </span>
            </div>

            {project.description && (
              <p className="text-gray-600 mb-4">{project.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  priorityColors[project.priority]
                }`}
              >
                {project.priority.charAt(0).toUpperCase() +
                  project.priority.slice(1)}{" "}
                Priority
              </span>
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                Due: {formatDate(project.dueDate)}
                {isOverdue && " (Overdue)"}
              </span>
              <span>
                {project.members?.length || 0} member
                {project.members?.length !== 1 ? "s" : ""}
              </span>
              <span>
                Created{" "}
                {new Date(project.createdAt).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-wrap gap-3">
            {/* Status Update Dropdown */}
            <div className="relative">
              <select
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={loading}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Delete Project
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Project
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{project.name}"? This action
                cannot be undone and will delete all associated tasks.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
