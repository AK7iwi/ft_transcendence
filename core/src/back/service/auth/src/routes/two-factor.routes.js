const authSchema = require('../schema/two-factor.schema');
const AuthController = require('../controllers/two-factor.controller');

module.exports = async function (fastify, opts) {

    // Setup 2FA
    fastify.post('/2fa/setup', {
        schema: authSchema.setup2FA,
        handler: AuthController.setup2FA
    });

    // Verify 2FA
    fastify.post('/2fa/verify', {
        schema: authSchema.verify2FA,
        handler: AuthController.verify2FA
    });

    // Disable 2FA
    fastify.post('/2fa/disable', {
        schema: authSchema.disable2FA,
        handler: AuthController.disable2FA
    });
};
