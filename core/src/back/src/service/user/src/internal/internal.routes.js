const InternalController = require('./internal.controller');

module.exports = async function (fastify, opts) {
    // Route for auth service to create user profile
    fastify.post('/createUser', {
        handler: InternalController.createUser
    });

    fastify.post('/update2FASecret', {
        handler: InternalController.update2FASecret
    });

    fastify.post('/enable2FA', {
        handler: InternalController.enable2FA
    });

    fastify.post('/disable2FA', {
        handler: InternalController.disable2FA
    });

    fastify.post('/createMatchHistory', {
        handler: InternalController.createMatchHistory
    });
};