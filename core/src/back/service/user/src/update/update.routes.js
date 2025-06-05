const updateSchema = require('./update.schema');
const UpdateController = require('./update.controller');
const JWTAuthentication = require('../../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Update username
    fastify.put('/username', {
        schema: updateSchema.updateUsername,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UpdateController.updateUsername
    });

    // Update password
    fastify.put('/password', {
        schema: updateSchema.updatePassword,
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UpdateController.updatePassword
    });
}
