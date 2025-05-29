const authSchema  = require('../schemas/auth.schema');
const SanitizeService = require('../../security/middleware/sanitize.service');

module.exports = async function (fastify, opts) {
    // Register route
    fastify.post('/register', {
        schema: authSchema.register,
        preHandler: SanitizeService.securityMiddleware,
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
        preHandler: SanitizeService.securityMiddleware,
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/login`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 500;
                return reply.code(statusCode).send({
                    success: false,
                    message: error.response?.data?.message || error.message || 'Internal Server Error'
                });
            }
        }
    });
};
