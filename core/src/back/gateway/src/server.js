const fastifyModule = require('fastify');
const cors = require('@fastify/cors');
const websocket = require('@fastify/websocket');

// Initialize Fastify
const fastify = fastifyModule({ logger: true });
// Register plugins
fastify.register(cors, { origin: true });
// Register websocket
fastify.register(websocket);

//Basic route
fastify.get('/', async (request, reply) => { return { message: 'Server is running' }; });
// Health check endpoint
fastify.get('/health', async (request, reply) => { return { status: 'Server is healthy' }; });
// Register routes
fastify.register(require('./routes/auth'), { prefix: '/auth' });
fastify.register(require('./routes/game'), { prefix: '/game' });
fastify.register(require('./routes/tournament'), { prefix: '/tournament' });
fastify.register(require('./routes/chat'), { prefix: '/chat' });
fastify.register(require('./routes/user'), { prefix: '/user' });

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
