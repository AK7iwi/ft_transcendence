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
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/me`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Get user profile failed'
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
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/${request.params.id}`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Failed to get user'
                });
            }
        }
    });

    // Update username route
    fastify.put('/username', {
        schema: userSchema.updateUsername,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.put(
                    `${process.env.USER_SERVICE_URL}/username`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Update username failed'
                });
            }
        }
    });

    // Update password route
    fastify.put('/password', {
        schema: userSchema.updatePassword,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.put(
                    `${process.env.USER_SERVICE_URL}/password`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Update password failed'
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
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/history`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Failed to get match history'
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
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/history/${request.params.id}`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Failed to get match history for user'
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
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.USER_SERVICE_URL}/stats/${request.params.id}`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Failed to get user stats'
                });
            }
        }
    });

    // Upload avatar route
    fastify.post('/upload-avatar', {
        schema: userSchema.uploadAvatar,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.USER_SERVICE_URL}/upload-avatar`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(status).send(data);
            } catch (error) {
                request.log.error(error);
                return reply.code(error.status).send({
                    success: false,
                    message: error.message || 'Avatar upload failed'
                });
            }
        }
    });
};
