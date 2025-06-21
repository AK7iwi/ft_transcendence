const chatSchema = require('./chat.schema');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const ChatController = require('./chat.controller');

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
