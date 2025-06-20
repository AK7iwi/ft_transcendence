const UserController = require('./user.controller');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Get user profile route
    fastify.get('/me', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UserController.getMe
    });

    // Get user by ID route
    fastify.get('/:id', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UserController.getUserById
    });

    // Get match history route
    fastify.get('/history', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UserController.getMatchHistory
    });

    // Get match history for specific user route
    fastify.get('/history/:id', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UserController.getMatchHistoryById
    });
}