const authSchema = require('./auth.schema');
const SanitizeService = require('../security/middleware/sanitize/sanitize.service');
const AuthController = require('./auth.controller');

module.exports = async function (fastify, opts) {
    fastify.post('/register', {
        schema: authSchema.register,
        preHandler: [SanitizeService.sanitize],
        handler: AuthController.register
    });

    fastify.post('/login', {
        schema: authSchema.login,
        preHandler: [SanitizeService.sanitize],
        handler: AuthController.login
    });
};