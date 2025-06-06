const internalSchema = require('./internal.schema');
const InternalController = require('./internal.controller');

module.exports = async function (fastify, opts) {
    // Update username (internal)
    fastify.put('/updateUsername', {
        schema: internalSchema.updateUsername,
        handler: InternalController.updateUsername
    });

    // Update password (internal)
    fastify.put('/updatePassword', {
        schema: internalSchema.updatePassword,
        handler: InternalController.updatePassword
    });
};