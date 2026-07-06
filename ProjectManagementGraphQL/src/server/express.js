import express from 'express';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

// Import schema and pubsub
import { typeDefs } from '../schema/index.js';
import { resolvers } from '../schema/index.js';
import { pubsub } from './pubsub.js';

export async function createExpressServer() {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = http.createServer(app);

  // Build executable schema
  const schema = makeExecutableSchema({ 
    typeDefs, 
    resolvers 
  });

  // Apollo Server setup with WebSocket support
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Apollo Studio landing page in development
      ApolloServerPluginLandingPageLocalDefault({ 
        embed: true,
        includeCookies: true 
      }),
    ],
    // Enhanced error formatting
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        locations: error.locations,
        path: error.path,
        extensions: error.extensions,
      };
    },
  });

  // Start Apollo Server
  await server.start();

  // Apply Apollo GraphQL middleware to Express
  app.use(
    '/graphql',
    cors({
      origin: true, // Allow all origins in development
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
      return {
        pubsub,
      };
      },
    })
  );

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Use the schema with WebSocket server
  useServer(
    {
      schema,
      context: async (ctx) => ({
        pubsub, // Inject pubsub in WebSocket context
        connectionParams: ctx.connectionParams, // Access connection params
      }),
      // Handle WebSocket connection lifecycle
      onConnect: async (ctx) => {
        console.log('🔌 WebSocket client connected');
        return true;
      },
      onDisconnect: (ctx) => {
        console.log('🔌 WebSocket client disconnected');
      },
      onError: (ctx, msg, errors) => {
        console.error('🔌 WebSocket error:', errors);
      },
    },
    wsServer
  );

  return httpServer;
}

// Export for backward compatibility
export const createApolloServer = createExpressServer;