const userSchema = require('../schemas/user.schema');
const SanitizeService = require('../../security/middleware/sanitize.service');
const JwtAuth = require('../../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Get user profile route
    fastify.get('/me', {
        schema: userSchema.getMe,
        preHandler: [JwtAuth.verifyToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.get(
                    `${process.env.USER_SERVICE_URL}/user/me?id=${request.user.id}`
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 400;
                const errorMessage = error.response?.data?.message || error.message || 'Get user profile failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Update username route
    fastify.put('/username', {
        schema: userSchema.updateUsername,
        preHandler: [SanitizeService.sanitize, JwtAuth.verifyToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.put(
                    `${process.env.USER_SERVICE_URL}/user/username`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 400;
                const errorMessage = error.response?.data?.message || error.message || 'Update username failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Update password route
    fastify.put('/password', {
        schema: userSchema.updatePassword,
        preHandler: [SanitizeService.sanitize, JwtAuth.verifyToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.axios.put(
                    `${process.env.USER_SERVICE_URL}/user/password`,
                    request.body
                );
                return reply.code(200).send(response.data);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.response?.status || 400;
                const errorMessage = error.response?.data?.message || error.message || 'Update password failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });
};
