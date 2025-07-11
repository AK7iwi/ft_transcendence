const InternalController = require('./internal.controller');

module.exports = async function (fastify, opts) {
    // Update username (internal)
    fastify.put('/updateUsername', {
        handler: InternalController.updateUsername
    });

    // Update password (internal)
    fastify.put('/updatePassword', {
        handler: InternalController.updatePassword
    });
};