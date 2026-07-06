// lib/apollo-client.js
import { ApolloClient, InMemoryCache, createHttpLink, from, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'

// HTTP link for queries and mutations
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql',
})

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
  })
)

// Split link - use WebSocket for subscriptions, HTTP for everything else
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([splitLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          projectActivity: {
            // Cache policy for pagination
            keyArgs: ['organizationId', 'projectId', 'token'],
            merge(existing, incoming, { args }) {
              if (args?.page === 1) {
                // Reset cache for first page
                return incoming
              }
              
              if (existing && incoming) {
                // Merge pages for pagination
                return {
                  ...incoming,
                  logs: [...existing.logs, ...incoming.logs]
                }
              }
              
              return incoming
            }
          }
        }
      }
    }
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'ignore',
    },
    query: {
      errorPolicy: 'all',
    },
  },
})