const UpdateController = require('../controllers/update.controller');
const updateSchema = require('../schema/update.schema');
const JWTService = require('../../security/middleware/jwt.service');

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
