const routes = async (fastify, options) => {
  // Test route
  fastify.get('/', async (request, reply) => {
    return { message: 'Server is running' };
  });
};

module.exports = routes; 