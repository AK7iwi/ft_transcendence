const internalSchema = require('./internal.schema');
const InternalController = require('./internal.controller');

module.exports = async function (fastify, opts) {
    // Route for auth service to create user profile
    fastify.post('/internal/createUser', {
        schema: internalSchema.createUser,
        handler: InternalController.createUser
    });

    // Update username (internal)
    fastify.put('/internal/updateUsername', {
        schema: internalSchema.updateUsername,
        handler: InternalController.updateUsername
    });

    // Update password (internal)
    fastify.put('/internal/updatePassword', {
        schema: internalSchema.updatePassword,
        handler: InternalController.updatePassword
    });

    fastify.post('/internal/secret2FA', {
        schema: internalSchema.secret2FA,
        handler: InternalController.secret2FA
    });

    fastify.post('/internal/enable2FA', {
        schema: internalSchema.enable2FA,
        handler: InternalController.enable2FA
    });



    fastify.post('/internal/disable2FA', {
        schema: internalSchema.disable2FA,
        handler: InternalController.disable2FA
    });
};