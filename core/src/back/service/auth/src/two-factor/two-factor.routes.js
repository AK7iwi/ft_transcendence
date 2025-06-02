const twoFactorSchema = require('./two-factor.schema');
const TwoFactorController = require('./two-factor.controller');

module.exports = async function (fastify, opts) {
    // Setup 2FA
    fastify.post('/2fa/setup', {
        schema: twoFactorSchema.setup2FA,
        handler: TwoFactorController.setup2FA
    });

    // Enable 2FA
    fastify.post('/2fa/verify-setup', {
        schema: twoFactorSchema.verify_setup2FA,
        handler: TwoFactorController.verify_setup2FA
    });

    // Verify 2FA
    fastify.post('/2fa/verify-login', {
        schema: twoFactorSchema.verify_login2FA,
        handler: TwoFactorController.verify_login2FA
    });

    // Disable 2FA
    fastify.post('/2fa/disable', {
        schema: twoFactorSchema.disable2FA,
        handler: TwoFactorController.disable2FA
    });
};
