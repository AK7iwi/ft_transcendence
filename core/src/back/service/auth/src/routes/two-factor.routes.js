const twoFactorSchema = require('../schema/two-factor.schema');
const TwoFactorController = require('../controllers/two-factor.controller');

module.exports = async function (fastify, opts) {
    // Setup 2FA
    fastify.post('/2fa/setup', {
        schema: twoFactorSchema.setup2FA,
        handler: TwoFactorController.setup2FA
    });

    // Verify 2FA
    fastify.post('/2fa/verify', {
        schema: twoFactorSchema.verify2FA,
        handler: TwoFactorController.verify2FA
    });

    // Disable 2FA
    fastify.post('/2fa/disable', {
        schema: twoFactorSchema.disable2FA,
        handler: TwoFactorController.disable2FA
    });
};
