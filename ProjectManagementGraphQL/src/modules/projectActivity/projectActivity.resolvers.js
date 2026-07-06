// modules/projectActivity/projectActivity.resolvers.js

import fetch from 'node-fetch';
import { SUBSCRIPTION_EVENTS } from '../../server/pubsub.js';

// In-memory store for pollers (unchanged)
const activityPollers = new Map();
const getProjectTopic = (projectId) => `${SUBSCRIPTION_EVENTS.PROJECT_ACTIVITY_UPDATED}_${projectId}`;

// Utility to make authenticated API calls (unchanged)
const callRestAPI = async (endpoint, token, params = {}) => {
  const url = new URL(`http://localhost:5000${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) url.searchParams.append(key, params[key]);
  });
  const response = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  return await response.json();
};

/**
 * Simplified polling logic. No need for data enrichment anymore!
 */
const pollForActivity = async ({ organizationId, projectId, token, pubsub }) => {
  const pollKey = `${organizationId}-${projectId}`;
  const pollerState = activityPollers.get(pollKey);
  if (!pollerState) return;

  try {
    const result = await callRestAPI(
      `/api/${organizationId}/projects/${projectId}/activity`,
      token,
      { 
        limit: 100,
        dateFrom: pollerState.lastFetchTime.toISOString(),
      }
    );
    
    pollerState.lastFetchTime = new Date();

    if (result && result.logs && result.logs.length > 0) {
      console.log(`[Polling] Found ${result.logs.length} new activities for project ${projectId}. Publishing...`);
      pubsub.publish(getProjectTopic(projectId), {
        projectActivityUpdated: result,
      });
    }
  } catch (error) {
    console.error(`[Polling] Error for project ${projectId}:`, error);
    if (error.message.includes('401')) {
      stopPolling(organizationId, projectId);
    }
  }
};

/**
 * Stops and cleans up a poller (unchanged).
 */
const stopPolling = (organizationId, projectId) => {
    const pollKey = `${organizationId}-${projectId}`;
    if (activityPollers.has(pollKey)) {
        console.log(`[Polling] Stopping poller for project ${projectId}.`);
        clearInterval(activityPollers.get(pollKey).poller);
        activityPollers.delete(pollKey);
    }
};

export const projectActivityResolvers = {
  Query: {
    // Query resolver is also simplified. No data fetching needed here either.
    projectActivity: async (_, { organizationId, projectId, token, page = 1, limit = 30, filters }) => {
      if (!token) {
        throw new Error('Authentication token is required');
      }
      try {
        const params = { page, limit };
        if (filters) {
          if (filters.actions?.length > 0) params.actions = filters.actions.join(',');
          if (filters.userId) params.userId = filters.userId;
          if (filters.dateFrom) params.dateFrom = filters.dateFrom;
          if (filters.dateTo) params.dateTo = filters.dateTo;
        }
        // Just call the API and return the result directly.
        // The User.id resolver will handle the field mismatch.
        return await callRestAPI(`/api/${organizationId}/projects/${projectId}/activity`, token, params);
      } catch (error) {
        console.error('Failed to fetch project activity:', error);
        throw new Error(`Failed to fetch project activity: ${error.message}`);
      }
    },
  },

  Subscription: {
    // This subscription connection logic is correct from our previous fix.
    projectActivityUpdated: {
      subscribe: (_, { organizationId, projectId, token }, { pubsub }) => {
        if (!token) throw new Error('Authentication token is required');
        const pollKey = `${organizationId}-${projectId}`;
        const topicName = getProjectTopic(projectId);
        
        if (!activityPollers.has(pollKey)) {
          console.log(`[Polling] Starting new poller for project ${projectId}.`);
          const poller = setInterval(() => pollForActivity({ organizationId, projectId, token, pubsub }), 3000);
          activityPollers.set(pollKey, { poller, count: 0, lastFetchTime: new Date() });
        }
        activityPollers.get(pollKey).count++;
        console.log(`[Polling] Subscriber added to project ${projectId}. Total: ${activityPollers.get(pollKey).count}`);
        
        const asyncIterator = pubsub.asyncIterableIterator([topicName]);
        const originalReturn = asyncIterator.return;
        asyncIterator.return = () => {
          const pollerState = activityPollers.get(pollKey);
          if (pollerState) {
            pollerState.count--;
            console.log(`[Polling] Subscriber removed from project ${projectId}. Total: ${pollerState.count}`);
            if (pollerState.count <= 0) {
              stopPolling(organizationId, projectId);
            }
          }
          return originalReturn ? originalReturn.call(asyncIterator) : Promise.resolve({ value: undefined, done: true });
        };
        return asyncIterator;
      },
      resolve: (payload) => payload.projectActivityUpdated,
    },
  },

  // ========== THE FIX IS HERE ==========
  // Add a resolver for the User type to handle the field name mismatch.
  User: {
    id: (parent) => {
      // `parent` is the object from your API: { _id: "...", name: "...", ... }
      // We return the value of `_id` when GraphQL asks for `id`.
      return parent._id;
    },
  },

  // We no longer need the AuditLog.performedBy resolver because the data is already an object.
  // The default resolver will work fine.
};