const chatSchema = require('../schemas/chat.schema');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');

module.exports = async function (fastify, opts) {
    fastify.post('/send-message', {
        schema: chatSchema.sendMessage,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            const { data, status } = await fastify.serviceClient.post(
                `${process.env.CHAT_SERVICE_URL}/send-message`,
                request.body,
                {
                    headers: {
                        'Authorization': request.headers.authorization
                    }
                }
            );
            return reply.code(status).send(data);
        }
    });

    fastify.get('/get-messages/:userId', {
        schema: chatSchema.getMessages,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: async (request, reply) => {
            const { data, status } = await fastify.serviceClient.get(
                `${process.env.CHAT_SERVICE_URL}/get-messages/${request.params.userId}`,
                {
                    headers: {
                        'Authorization': request.headers.authorization
                    }
                }
            );
            return reply.code(status).send(data);
        }
    });
};