const chatSchema = require('../schemas/chat.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {

    fastify.post('/message', {
        schema: chatSchema.sendMessage,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.post(
                    `${process.env.CHAT_SERVICE_URL}/message`,
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
                    message: error.message || 'Failed to send message'
                });
            }
        }
    });

    fastify.get('/messages/:userId', {
        schema: chatSchema.getMessages,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            try {
                const { data, status } = await fastify.serviceClient.get(
                    `${process.env.CHAT_SERVICE_URL}/messages/${request.params.userId}`,
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
                    message: error.message || 'Failed to get messages'
                });
            }
        }
    });
};