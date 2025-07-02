const chatSchema = require('../schemas/chat.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    fastify.post('/message', {
        schema: chatSchema.sendMessage,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.post(
                    `${process.env.CHAT_SERVICE_URL}/message`,
                    request.body,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 500;
                const errorMessage = error.message || 'Failed to send message';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });

    fastify.get('/messages/:userId', {
        schema: chatSchema.getMessages,
        preHandler: [SanitizeService.sanitize, JWTAuthentication.verifyJWTToken],
        handler: async (request, reply) => {
            try {
                const response = await fastify.serviceClient.get(
                    `${process.env.CHAT_SERVICE_URL}/messages/${request.params.userId}`,
                    {
                        headers: {
                            'Authorization': request.headers.authorization
                        }
                    }
                );
                return reply.send(response);
            } catch (error) {
                request.log.error(error);
                const statusCode = error.status || 500;
                const errorMessage = error.message || 'Failed to get messages';
                return reply.code(statusCode).send({
                    success: false,
                    message: errorMessage
                });
            }
        }
    });
};