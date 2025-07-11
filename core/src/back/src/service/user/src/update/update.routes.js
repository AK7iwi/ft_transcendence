const UpdateController = require('./update.controller');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Update username
    fastify.put('/username', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UpdateController.updateUsername
    });

    // Update password
    fastify.put('/password', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: UpdateController.updatePassword
    });
}
