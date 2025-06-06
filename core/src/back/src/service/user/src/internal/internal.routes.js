const internalSchema = require('./internal.schema');
const InternalController = require('./internal.controller');

module.exports = async function (fastify, opts) {
    // Route for auth service to create user profile
    fastify.post('/createUser', {
        schema: internalSchema.createUser,
        handler: InternalController.createUser
    });

    fastify.post('/update2FASecret', {
        schema: internalSchema.update2FASecret,
        handler: InternalController.update2FASecret
    });

    fastify.post('/enable2FA', {
        schema: internalSchema.enable2FA,
        handler: InternalController.enable2FA
    });

    fastify.post('/disable2FA', {
        schema: internalSchema.disable2FA,
        handler: InternalController.disable2FA
    });
};