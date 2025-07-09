const friendSchema = require('../schemas/friend.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    
    fastify.post('/add', {
        schema: friendSchema.addFriend,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.FRIEND_SERVICE_URL}/add`,
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
                    message: error.message || 'Failed to add friend'
                });
            }
        }
    });

    // Get friends
    fastify.get('/friends', {
        schema: friendSchema.getFriends,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.FRIEND_SERVICE_URL}/friends`,
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
                    message: error.message || 'Failed to fetch friends'
                });
            }
        }
    });

    fastify.get('/blocked', {
        schema: friendSchema.getBlocked,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.FRIEND_SERVICE_URL}/blocked`,
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
                    message: error.message || 'Failed to fetch blocked users'
                });
            }
        }
    });

    fastify.post('/block', {
        schema: friendSchema.blockUser,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.FRIEND_SERVICE_URL}/block`,
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
                    message: error.message || 'Failed to block user'
                });
            }
        }
    });

    fastify.post('/unblock', {
        schema: friendSchema.unblockUser,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.FRIEND_SERVICE_URL}/unblock`,
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
                    message: error.message || 'Failed to unblock user'
                });
            }
        }
    });

    fastify.delete('/remove', {
        schema: friendSchema.removeFriend,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.delete(
                    `${process.env.FRIEND_SERVICE_URL}/remove`,
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
                    message: error.message || 'Failed to remove friend'
                });
            }
        }
    });
};