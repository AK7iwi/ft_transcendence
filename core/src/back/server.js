const fastifyModule = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');
const authRoutes = require('./src/auth/auth.routes');
const updateRoutes = require('./src/update/update.routes');

//Load environment variables
require('dotenv').config();
//Initialize database schema
require('./src/database/db.schema'); 

// Initialize Fastify
const fastify = fastifyModule({ logger: true });

// Register plugins
fastify.register(cors, { origin: true });

// Register websocket
fastify.register(websocket);

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(updateRoutes, { prefix: '/update' });

// Error handling
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

//Test route
fastify.get('/', async (request, reply) => { return { message: 'Server is running' }; });

// Health check endpoint
fastify.get('/health', async (request, reply) => { return { status: 'Server is healthy' }; });

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
