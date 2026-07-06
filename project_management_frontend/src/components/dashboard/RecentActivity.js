'use client'
import { useState, useEffect } from 'react';

export default function RecentActivity({orgId, token, showPagination = false, defaultLimit = 5}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: defaultLimit,
    total: 0,
    totalPages: 0,
    hasMore: false,
    hasPrevious: false
  });
  const [viewMode, setViewMode] = useState('recent'); // 'recent' or 'all'

  useEffect(() => {
    fetchRecentActivity(1);
  }, [orgId, viewMode]);

  const fetchRecentActivity = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      if (!orgId) {
        throw new Error('Organization ID is required');
      }
      
      const limit = viewMode === 'recent' ? defaultLimit : 20;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/${orgId}/audit-logs?page=${page}&limit=${limit}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Use the formatted data directly from backend
      const transformedActivities = data.logs.map(log => ({
        id: log.id,
        user: log.performedBy?.name || 'Unknown User',
        userEmail: log.performedBy?.email,
        action: extractActionFromMessage(log.message),
        target: extractTargetFromMessage(log.message),
        time: formatTimeAgo(log.createdAt),
        type: mapActionToType(log.action),
        originalAction: log.action,
        message: log.message,
        details: log.details,
        displayData: log.displayData,
        createdAt: log.createdAt,
        // Extract assignment info for better display
        assignmentInfo: getAssignmentInfo(log)
      }));

      setActivities(transformedActivities);
      
      // Use the proper pagination data from backend
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
        hasMore: data.pagination.hasMore,
        hasPrevious: data.pagination.hasPrevious
      });

    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      setError(err.message);
      
      // Fallback to mock data if API fails
      if (page === 1) {
        setActivities(getMockActivities());
        setPagination({ 
          page: 1, 
          limit: defaultLimit, 
          total: 5, 
          totalPages: 1, 
          hasMore: false, 
          hasPrevious: false 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const extractActionFromMessage = (message) => {
    // Extract action from the formatted message
    const parts = message.split(' ');
    if (parts.length < 2) return 'performed action';
    
    // Get everything after the user name (first part)
    return parts.slice(1).join(' ').split(' "')[0];
  };

  const extractTargetFromMessage = (message) => {
    // Extract target from quotes in the message
    const match = message.match(/"([^"]+)"/);
    return match ? match[1] : 'Unknown Target';
  };

  const getAssignmentInfo = (log) => {
    if (log.action === 'TASK_ASSIGNED' || log.action === 'TASK_REASSIGNED') {
      return {
        assignedTo: log.details?.assignedToName,
        previousAssignee: log.details?.previousAssigneeName
      };
    }
    return null;
  };

  const mapActionToType = (action) => {
    if (action.includes('TASK') && action.includes('STATUS_CHANGED')) return 'task_completed';
    if (action.includes('PROJECT_CREATED')) return 'project_created';
    if (action.includes('INVITE') || action.includes('MEMBER') || action.includes('USER_REGISTERED')) return 'member_joined';
    if (action.includes('COMMENT')) return 'comment';
    return 'task_updated';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1d ago';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    
    return date.toLocaleDateString();
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'recent' ? 'all' : 'recent';
    setViewMode(newMode);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !loading) {
      fetchRecentActivity(newPage);
    }
  };

  const generatePageNumbers = () => {
    const { page, totalPages } = pagination;
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (page <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  // Jump to page functionality
  const handleJumpToPage = (e) => {
    e.preventDefault();
    const pageInput = e.target.elements.pageNumber;
    const targetPage = parseInt(pageInput.value);
    
    if (targetPage >= 1 && targetPage <= pagination.totalPages) {
      handlePageChange(targetPage);
      pageInput.value = '';
    }
  };

  // Quick navigation
  const handleFirstPage = () => handlePageChange(1);
  const handleLastPage = () => handlePageChange(pagination.totalPages);
  const handlePrevPage = () => handlePageChange(pagination.page - 1);
  const handleNextPage = () => handlePageChange(pagination.page + 1);

  // Fallback mock data
  const getMockActivities = () => [
    {
      id: 1,
      user: 'John Doe',
      action: 'completed task',
      target: 'Design new homepage',
      time: '2 hours ago',
      type: 'task_completed',
      message: 'John Doe completed task "Design new homepage"'
    },
    {
      id: 2,
      user: 'Sarah Johnson',
      action: 'created project',
      target: 'Mobile App Redesign',
      time: '4 hours ago',
      type: 'project_created',
      message: 'Sarah Johnson created project "Mobile App Redesign"'
    },
    {
      id: 3,
      user: 'Mike Wilson',
      action: 'commented on',
      target: 'User Authentication System',
      time: '6 hours ago',
      type: 'comment',
      message: 'Mike Wilson commented on "User Authentication System"'
    },
    {
      id: 4,
      user: 'Emma Davis',
      action: 'joined team',
      target: 'Development Team',
      time: '1 day ago',
      type: 'member_joined',
      message: 'Emma Davis joined team "Development Team"'
    },
    {
      id: 5,
      user: 'Alex Brown',
      action: 'updated task',
      target: 'Database Migration',
      time: '2 days ago',
      type: 'task_updated',
      message: 'Alex Brown updated task "Database Migration"'
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return (
          <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'project_created':
        return (
          <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )
      case 'comment':
        return (
          <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        )
      case 'member_joined':
        return (
          <div className="bg-purple-500 w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="bg-gray-500 w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {viewMode === 'recent' ? 'Recent Activity' : 'All Activity'}
          </h3>
          <div className="space-y-4">
            {[...Array(defaultLimit)].map((_, i) => (
              <div key={i} className="flex space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state (still show fallback data)
  const displayActivities = activities.length > 0 ? activities : getMockActivities();

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {viewMode === 'recent' ? 'Recent Activity' : 'All Activity'}
          </h3>
          <div className="flex items-center space-x-2">
            {error && (
              <span className="text-xs text-red-500" title={error}>
                ⚠️
              </span>
            )}
            <button 
              onClick={() => fetchRecentActivity(pagination.page)}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            {showPagination && (
              <button 
                onClick={toggleViewMode}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                {viewMode === 'recent' ? 'View all' : 'View recent'}
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Activity Count & Pagination Info */}
        {viewMode === 'all' && pagination.total > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>
                Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
              </span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
            
            {/* Quick jump to page */}
            {pagination.totalPages > 5 && (
              <form onSubmit={handleJumpToPage} className="flex items-center gap-2">
                <span className="text-xs">Jump to:</span>
                <input
                  type="number"
                  name="pageNumber"
                  min="1"
                  max={pagination.totalPages}
                  placeholder="Page"
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  Go
                </button>
              </form>
            )}
          </div>
        )}
        
        <div className="flow-root">
          <ul className="-mb-8">
            {displayActivities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== displayActivities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        {/* Use the formatted message from backend */}
                        <p className="text-sm text-gray-700">
                          {activity.message}
                        </p>
                        
                        {/* Show additional details in full view */}
                        {viewMode === 'all' && (
                          <div className="mt-1 text-xs text-gray-400 space-y-1">
                            {/* Assignment details for task reassignments */}
                            {activity.assignmentInfo && activity.assignmentInfo.previousAssignee !== activity.assignmentInfo.assignedTo && (
                              <div>
                                From: {activity.assignmentInfo.previousAssignee} → To: {activity.assignmentInfo.assignedTo}
                              </div>
                            )}
                            
                            {/* Status changes */}
                            {activity.details?.oldStatus && activity.details?.newStatus && (
                              <div>
                                Status: {activity.details.oldStatus} → {activity.details.newStatus}
                              </div>
                            )}
                            
                            {/* User email */}
                            {activity.userEmail && (
                              <div>
                                by {activity.userEmail}
                              </div>
                            )}
                            
                            {/* Project context for tasks */}
                            {activity.details?.projectName && activity.originalAction.includes('TASK') && (
                              <div>
                                in project: {activity.details.projectName}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <div>{activity.time}</div>
                        {viewMode === 'all' && (
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Enhanced Pagination Controls */}
        {viewMode === 'all' && pagination.totalPages > 1 && (
          <div className="mt-6 space-y-4">
            {/* Main pagination controls */}
            <div className="flex items-center justify-center space-x-1">
              {/* First page button */}
              <button
                onClick={handleFirstPage}
                disabled={pagination.page === 1 || loading}
                className="inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous button */}
              <button
                onClick={handlePrevPage}
                disabled={!pagination.hasPrevious || loading}
                className="inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers */}
              {generatePageNumbers().map((pageNum, index) => (
                <button
                  key={index}
                  onClick={() => pageNum !== '...' && handlePageChange(pageNum)}
                  disabled={pageNum === '...' || loading}
                  className={`inline-flex items-center px-3 py-2 border text-sm font-medium transition-colors ${
                    pageNum === pagination.page
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                      : pageNum === '...'
                      ? 'border-gray-300 bg-white text-gray-400 cursor-default'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  {pageNum}
                </button>
              ))}

              {/* Next button */}
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasMore || loading}
                className="inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last page button */}
              <button
                onClick={handleLastPage}
                disabled={pagination.page === pagination.totalPages || loading}
                className="inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Pagination summary for mobile */}
            <div className="sm:hidden text-center text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages} • {pagination.total} total activities
            </div>
          </div>
        )}

        {/* Empty state */}
        {activities.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1">Activity will appear here when team members interact with projects and tasks</p>
          </div>
        )}
      </div>
    </div>
  )
}