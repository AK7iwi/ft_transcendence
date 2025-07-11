const TwoFactorController = require('./two-factor.controller');
const JWTAuthentication = require('../security/middleware/jwt/jwt.auth');

module.exports = async function (fastify, opts) {
    // Setup 2FA
    fastify.post('/2fa/setup', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TwoFactorController.setup2FA
    });

    // Enable 2FA
    fastify.post('/2fa/verify-setup', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TwoFactorController.verify_setup2FA
    });

    // Verify 2FA
    fastify.post('/2fa/verify-login', {
        handler: TwoFactorController.verify_login2FA
    });

    // Disable 2FA
    fastify.post('/2fa/disable', {
        preHandler: [JWTAuthentication.verifyJWTToken],
        handler: TwoFactorController.disable2FA
    });
};
