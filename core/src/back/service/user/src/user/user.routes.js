const UserController = require('./user.controller');

module.exports = async function (fastify, opts) {
    // Get user profile route
    fastify.get('/me', {
        handler: UserController.getMe
    });
}