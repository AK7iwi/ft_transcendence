const authSchema  = require('../schemas/auth.schema');

module.exports = async function (fastify, opts) {
    // Register route
    fastify.post('/register', {
        schema: authSchema.register,
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/register`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.response?.status || 400).send({
                    success: false,
                    message: error.response?.data?.message || error.message
                });
            }
        }
    });

    // Login route
    fastify.post('/login', {
        schema: authSchema.login,
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/login`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.response?.status || 401).send({
                    success: false,
                    message: error.response?.data?.message || error.message
                });
            }
        }
    });
};
