require('dotenv').config();
const fastifyModule = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');
const routes = require('./src/routes');
require('./src/database/schema');

// Initialize Fastify
const fastify = fastifyModule({
  logger: true
});

// Register plugins
fastify.register(cors, {
  origin: true // Allow all origins in development
});

fastify.register(websocket);

// Register routes
fastify.register(routes);

// Error handling
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ 
      port: process.env.PORT || 3000,
      host: '0.0.0.0'  // Important for Docker
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
