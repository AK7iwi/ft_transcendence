const internalSchema = require('../schema/internal.schema');
const InternalController = require('../controllers/internal.controller');

module.exports = async function (fastify, opts) {
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
};