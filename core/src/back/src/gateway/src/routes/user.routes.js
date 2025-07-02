const userSchema = require('../schemas/user.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Get user profile route
    fastify.get('/me', {
        schema: userSchema.getMe,
        preHandler: [JWTAuthentication.verifyJWTToken], 
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/me`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
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

    // Get user by ID route
    fastify.get('/:id', {
        schema: userSchema.getUserById,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/${request.params.id}`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 500;
                const errorMessage = error.message || 'Failed to get user';
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
                    `${process.env.USER_SERVICE_URL}/username`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
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
                    `${process.env.USER_SERVICE_URL}/password`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
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

    // Get match history route
    fastify.get('/history', {
        schema: userSchema.getMatchHistory,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/history`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Failed to get match history';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Get match history for specific user route
    fastify.get('/history/:id', {
        schema: userSchema.getMatchHistoryById,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/history/${request.params.id}`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Failed to get match history for user';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Get user stats route
    fastify.get('/stats/:id', {
        schema: userSchema.getUserStats,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/stats/${request.params.id}`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Failed to get user stats';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Upload avatar route
    fastify.post('/upload-avatar', {
        schema: userSchema.uploadAvatar,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.USER_SERVICE_URL}/upload-avatar`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(200).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Avatar upload failed';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });
};
