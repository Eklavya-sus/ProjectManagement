import { createExpressServer } from './server/express.js';

async function startServer() {
  try {
    const httpServer = await createExpressServer();
    const PORT = process.env.PORT || 4000;

    httpServer.listen(PORT, () => {
      console.log('GraphQL Blogging Platform Server Ready!');
      console.log(`Server running at: http://localhost:${PORT}`);
      console.log(`GraphQL Playground: http://localhost:${PORT}/graphql`);
      console.log(`WebSocket Subscriptions: ws://localhost:${PORT}/graphql`);
    });

    const gracefulShutdown = (signal) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
})

startServer();
