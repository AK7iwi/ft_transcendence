const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');
const ChatController = require('./chat.controller');

module.exports = async function (fastify, opts) {
    fastify.post('/send-message', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: ChatController.sendMessage
    });

    
    fastify.get('/get-messages/:userId', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: ChatController.getMessages
    });
};
