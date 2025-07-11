const InternalController = require('./internal.controller');

module.exports = async function (fastify, opts) {
    // Route for auth service to create user profile
    fastify.post('/createUser', {
        handler: InternalController.createUser
    });

    // Route for auth service to update username
    fastify.put('/updateUsername', {
        handler: InternalController.updateUsername
    });

    // Route for user service to update avatar
    fastify.put('/updateAvatar', {
        handler: InternalController.updateAvatar
    });
};