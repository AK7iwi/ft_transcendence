const friendSchema = require('../schemas/friend.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Add a friend
    fastify.post('/add', {
        schema: friendSchema.addFriend,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.FRIEND_SERVICE_URL}/add`,
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
                const errorMessage = error.message || 'Failed to add friend';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Get friends
    fastify.get('/friends', {
        schema: friendSchema.getFriends,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.FRIEND_SERVICE_URL}/friends`,
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
                const errorMessage = error.message || 'Failed to fetch friends';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    fastify.get('/blocked', {
        schema: friendSchema.getBlocked,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.FRIEND_SERVICE_URL}/blocked`,
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
                const errorMessage = error.message || 'Failed to fetch blocked users';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Block a user
    fastify.post('/block', {
        schema: friendSchema.blockUser,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.FRIEND_SERVICE_URL}/block`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.code(201).send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 400;
                const errorMessage = error.message || 'Failed to block user';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    fastify.post('/unblock', {
        schema: friendSchema.unblockUser,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.FRIEND_SERVICE_URL}/unblock`,
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
                const errorMessage = error.message || 'Failed to unblock user';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    // Remove a friend
    fastify.delete('/remove', {
        schema: friendSchema.removeFriend,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.delete(
                    `${process.env.FRIEND_SERVICE_URL}/remove`,
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
                const errorMessage = error.message || 'Failed to remove friend';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });
};