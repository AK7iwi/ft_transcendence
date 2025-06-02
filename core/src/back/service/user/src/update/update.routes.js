const updateSchema = require('./update.schema');
const UpdateController = require('./update.controller');

module.exports = async function (fastify, opts) {
    // Update username
    fastify.put('/username', {
        schema: updateSchema.updateUsername,
        handler: UpdateController.updateUsername
    });

    // Update password
    fastify.put('/password', {
        schema: updateSchema.updatePassword,
        handler: UpdateController.updatePassword
    });
}
