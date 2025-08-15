const chatSchema = require('./chat.schema');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const ChatController = require('./chat.controller');

module.exports = async function (fastify, opts) {
    fastify.post('/send-message', {
        schema: chatSchema.sendMessage,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: ChatController.sendMessage
    });

    fastify.get('/get-messages/:userId', {
        schema: chatSchema.getMessages,
        preHandler: [JWTAuthentication.verifyJWTToken, SanitizeService.sanitize],
        handler: ChatController.getMessages
    });
};
