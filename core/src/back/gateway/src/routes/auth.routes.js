const authSchema  = require('../schemas/auth.schema');
const SanitizeService = require('../../security/middleware/sanitize.service');
const JwtAuth = require('../../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Register route
    fastify.post('/register', {
        schema: authSchema.register,
        preHandler: SanitizeService.sanitize,
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/register`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 400;
                return reply.code(statusCode).send({
                    success: false,
                    message: error.response?.data?.message || error.message
                });
            }
        }
    });

    // Login route
    fastify.post('/login', {
        schema: authSchema.login,
        preHandler: SanitizeService.sanitize,
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.post(
                    `${process.env.AUTH_SERVICE_URL}/auth/login`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 401;
                return reply.code(statusCode).send({
                    success: false,
                    message: error.response?.data?.message || error.message || 'Internal Server Error'
                });
            }
        }
    });

    //Internal routes
    
    fastify.put('/internal/username', {
        schema: authSchema.updateUsername,
        preHandler: [SanitizeService.sanitize, JwtAuth.verifyToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.put(
                    `${process.env.AUTH_SERVICE_URL}/auth/internal/username`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 400;
                return reply.code(statusCode).send({
                    success: false,
                    message: error.response?.data?.message || error.message
                });
            }
        }
    });

    fastify.put('/internal/password', {
        schema: authSchema.updatePassword,
        preHandler: [SanitizeService.sanitize, JwtAuth.verifyToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.put(
                    `${process.env.AUTH_SERVICE_URL}/auth/internal/password`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 400;
                return reply.code(statusCode).send({
                    success: false,
                    message: error.response?.data?.message || error.message
                });
            }
        }
    });

};
