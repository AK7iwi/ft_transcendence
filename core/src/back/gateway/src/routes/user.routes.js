const userSchema = require('../schemas/user.schema');
const SanitizeService = require('../../security/middleware/sanitize.service');
const JWTAuthentication = require('../../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Get user profile route
    fastify.get('/me', {
        schema: userSchema.getMe,
        preHandler: [JWTAuthentication.verifyJWTToken], 
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/user/me`
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Get user profile failed';
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
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.put(
                    `${process.env.USER_SERVICE_URL}/user/username`,
                    request.body
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Update username failed';
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
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.put(
                    `${process.env.USER_SERVICE_URL}/user/password`,
                    request.body
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Update password failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });
};
