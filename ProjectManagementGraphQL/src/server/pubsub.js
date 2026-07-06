import { PubSub } from 'graphql-subscriptions';

// Create a single PubSub instance to be shared across the application
// This handles publishing and subscribing to real-time events
export const pubsub = new PubSub();

// Subscription event constants for type safety and consistency
export const SUBSCRIPTION_EVENTS = { 
  PROJECT_ACTIVITY_UPDATED: 'PROJECT_ACTIVITY_UPDATED',
};