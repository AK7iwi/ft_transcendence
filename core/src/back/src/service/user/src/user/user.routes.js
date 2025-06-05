const UserController = require('./user.controller');
const JWTAuthentication = require('../../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Get user profile route
    fastify.get('/me', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UserController.getMe
    });
}