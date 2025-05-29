const updateSchema = require('../schema/update.schema');
const UpdateController = require('../controllers/update.controller');

module.exports = async function (fastify, opts) {

    fastify.put('/username', {
        schema: updateSchema.updateUsername,
        handler: UpdateController.updateUsername
    });

    fastify.put('/password', {
        schema: updateSchema.updatePassword,
        handler: UpdateController.updatePassword
    });
}
