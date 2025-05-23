const routes = async (fastify, options) => {
  // Test route
  fastify.get('/', async (request, reply) => {
    return { message: 'Server is running' };
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });
};

module.exports = routes; 