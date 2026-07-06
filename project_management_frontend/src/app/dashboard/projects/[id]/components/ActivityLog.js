'use client'
import { useState } from 'react'
import { useQuery, useSubscription } from '@apollo/client/react'
import { gql } from '@apollo/client'

// GraphQL Queries and Subscriptions
const GET_PROJECT_ACTIVITY = gql`
  query GetProjectActivity(
    $organizationId: ID!
    $projectId: ID!
    $token: String!
    $page: Int
    $limit: Int
    $filters: ActivityFilters
  ) {
    projectActivity(
      organizationId: $organizationId
      projectId: $projectId
      token: $token
      page: $page
      limit: $limit
      filters: $filters
    ) {
      logs {
        id
        action
        message
        createdAt
        performedBy {
          id
          name
          email
        }
        details {
          taskTitle
          projectName
          oldStatus
          newStatus
          assignedToName
          previousAssigneeName
        }
      }
      pagination {
        page
        limit
        total
        totalPages
        hasMore
        hasPrevious
      }
    }
  }
`

const SUBSCRIBE_PROJECT_ACTIVITY = gql`
  subscription SubscribeToProjectActivity(
    $organizationId: ID!
    $projectId: ID!
    $token: String!
  ) {
    projectActivityUpdated(
      organizationId: $organizationId
      projectId: $projectId
      token: $token
    ) {
      logs {
        id
        action
        message
        createdAt
        performedBy {
          id
          name
          email
        }
        details {
          taskTitle
          projectName
          oldStatus
          newStatus
          assignedToName
          previousAssigneeName
        }
      }
      pagination {
        page
        limit
        total
        totalPages
        hasMore
        hasPrevious
      }
    }
  }
`

export function ActivityLog({ projectId, orgId, token }) {
  const [showAll, setShowAll] = useState(false)

  // useQuery is our single source of truth for the logs
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_PROJECT_ACTIVITY, {
    variables: {
      organizationId: orgId,
      projectId: projectId,
      token: token,
      page: 1,
      limit: 20
    },
    fetchPolicy: 'cache-and-network',
  })

  // Enhanced subscription with better error handling and logging
  const { data: subscriptionData, error: subscriptionError } = useSubscription(
    SUBSCRIBE_PROJECT_ACTIVITY,
    {
      variables: {
        organizationId: orgId,
        projectId: projectId,
        token: token
      },
      onData: ({ client, data: subscriptionData }) => {
        console.log("🔔 Subscription data received:", subscriptionData);
        
        // Check if subscription data exists and has the expected structure
        if (!subscriptionData?.data?.projectActivityUpdated?.logs) {
          console.warn("❌ Subscription data missing or malformed:", subscriptionData);
          return;
        }

        const newActivityData = subscriptionData.data.projectActivityUpdated;
        const newLogs = newActivityData.logs;
        
        console.log(`📊 Processing ${newLogs.length} new logs from subscription`);
        
        const queryVariables = {
          organizationId: orgId,
          projectId: projectId,
          token: token,
          page: 1,
          limit: 20
        };

        try {
          // Read the current data from the cache for our specific query
          const prevData = client.readQuery({
            query: GET_PROJECT_ACTIVITY,
            variables: queryVariables,
          });

          if (!prevData?.projectActivity?.logs) {
            console.warn("⚠️ No previous data in cache, skipping update");
            return;
          }

          const prevLogs = prevData.projectActivity.logs;
          const existingIds = new Set(prevLogs.map(log => log.id));
          
          // Filter out logs that already exist in the cache
          const uniqueNewLogs = newLogs.filter(log => {
            const isUnique = !existingIds.has(log.id);
            if (!isUnique) {
              console.log(`🔄 Log ${log.id} already exists in cache, skipping`);
            }
            return isUnique;
          });

          console.log(`✨ Adding ${uniqueNewLogs.length} unique new logs to cache`);

          // If all new logs are already in the cache, do nothing.
          if (uniqueNewLogs.length === 0) {
            console.log("ℹ️ No new unique logs to add to cache");
            return;
          }

          // Write the new, combined data back to the cache
          const updatedData = {
            projectActivity: {
              ...prevData.projectActivity,
              logs: [...uniqueNewLogs, ...prevLogs].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
              ), // Sort by newest first
              pagination: {
                ...prevData.projectActivity.pagination,
                total: prevData.projectActivity.pagination.total + uniqueNewLogs.length,
              },
            },
          };

          client.writeQuery({
            query: GET_PROJECT_ACTIVITY,
            variables: queryVariables,
            data: updatedData,
          });

          console.log("✅ Cache updated successfully with new activity logs");

        } catch (e) {
          // This can happen if the query is not in the cache yet
          console.warn("⚠️ Could not update cache from subscription:", e.message);
          console.log("🔄 Refetching data instead...");
          refetch(); // Fallback: refetch the data
        }
      },
      onError: (error) => {
        console.error("❌ Subscription error:", error);
      },
      onComplete: () => {
        console.log("🔚 Subscription completed");
      },
      shouldResubscribe: true, // Auto-resubscribe on connection drops
    }
  );

  // Log subscription errors
  if (subscriptionError) {
    console.error("❌ Subscription Error:", subscriptionError);
  }

  const getActionIcon = (action) => {
    const iconMap = {
      'TASK_CREATED': '📝',
      'TASK_UPDATED': '✏️',
      'TASK_STATUS_CHANGED': '🔄',
      'TASK_ASSIGNED': '👤',
      'TASK_REASSIGNED': '🔄',
      'TASK_UNASSIGNED': '❌',
      'TASK_DELETED': '🗑️',
      'COMMENT_ADDED': '💬',
      'FILE_UPLOADED': '📎',
      'default': '📌'
    }
    return iconMap[action] || iconMap.default
  }

  const getActionColor = (action) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATED')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800'
    if (action.includes('ASSIGNED')) return 'bg-purple-100 text-purple-800'
    if (action.includes('STATUS_CHANGED')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const logDate = new Date(date)
    const diffInMinutes = Math.floor((now - logDate) / (1000 * 60))
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1d ago'
    if (diffInDays < 7) return `${diffInDays}d ago`
    return logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleShowAll = () => {
    setShowAll(!showAll)
  }

  const loadMoreLogs = () => {
    if (data?.projectActivity?.pagination?.hasMore) {
      fetchMore({
        variables: {
          page: data.projectActivity.pagination.page + 1,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult?.projectActivity?.logs) return prev;
          return {
            ...prev,
            projectActivity: {
              ...fetchMoreResult.projectActivity,
              logs: [
                ...prev.projectActivity.logs,
                ...fetchMoreResult.projectActivity.logs
              ]
            }
          }
        }
      })
    }
  }

  const refreshLogs = () => {
    console.log("🔄 Manually refreshing logs...");
    refetch()
  }

  // All logs and pagination data are now read directly from the 'data' object from useQuery
  const allLogs = data?.projectActivity?.logs || []
  const pagination = data?.projectActivity?.pagination || {}
  const displayLogs = showAll ? allLogs : allLogs.slice(0, 5)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Project Activity</h3>
          <div className="flex items-center space-x-2">
            {error && (
              <span className="text-xs text-red-500" title={error.message}>
                ⚠️ Query Error
              </span>
            )}
            {subscriptionError && (
              <span className="text-xs text-orange-500" title={subscriptionError.message}>
                📡 Subscription Error
              </span>
            )}
            <div className="flex items-center space-x-1">
              
            </div>
            <button
              onClick={refreshLogs}
              disabled={loading}
              className="text-xs text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
            >
              {loading && !data ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
        {showAll && pagination.total > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            Showing {allLogs.length} of {pagination.total} activities
          </div>
        )}
      </div>

      <div className="p-4">
        {allLogs.length === 0 && !loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-500 text-sm">No project activity yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Activity will appear here when team members work on tasks and projects
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayLogs.map((log, index) => (
              <div key={log.id || index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        {log.message || `${log.performedBy?.name || 'Unknown User'} ${log.action.toLowerCase().replace(/_/g, ' ')}`}
                      </p>
                      
                      <div className="flex items-center mt-1 space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        
                        {log.details?.taskTitle && (
                          <span className="text-xs text-gray-500">
                            {log.details.taskTitle}
                          </span>
                        )}
                      </div>

                      {showAll && (
                        <div className="mt-1 text-xs text-gray-400 space-y-1">
                          {log.details?.oldStatus && log.details?.newStatus && (
                            <div>
                              Status: {log.details.oldStatus} → {log.details.newStatus}
                            </div>
                          )}
                          {log.details?.assignedToName && (
                            <div>
                              Assigned to: {log.details.assignedToName}
                            </div>
                          )}
                          {log.details?.previousAssigneeName && log.details?.assignedToName && (
                            <div>
                              Reassigned: {log.details.previousAssigneeName} → {log.details.assignedToName}
                            </div>
                          )}
                          {log.performedBy?.email && (
                            <div>
                              by {log.performedBy.email}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-xs text-gray-500 whitespace-nowrap ml-2">
                      <div>{getTimeAgo(log.createdAt)}</div>
                      {showAll && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(log.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {showAll && pagination.hasMore && (
              <div className="text-center pt-4 border-t border-gray-100">
                <button
                  onClick={loadMoreLogs}
                  disabled={loading}
                  className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Loading more...' : 'Load more activity'}
                </button>
              </div>
            )}
          </div>
        )}

        {allLogs.length > 5 && (
          <div className="text-center pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={handleShowAll}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              {showAll ? 'Show less' : `View all activity (${pagination.total || allLogs.length})`}
            </button>
          </div>
        )}

        {loading && allLogs.length === 0 && (
          <div className="text-center py-4">
            <div className="text-sm text-gray-500">Loading activity...</div>
          </div>
        )}
      </div>
    </div>
  )
}