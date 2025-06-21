const ChatController = require('./chat.controller');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Send message
    fastify.post('/message', {
        schema: chatSchema.sendMessage,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: ChatController.sendMessage
    });

    fastify.get('/messages/:userId', {
        schema: chatSchema.getMessages,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: ChatController.getMessages
    });
};
