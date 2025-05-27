const AuthController = require('../controllers/auth.controller');
const authSchema = require('../schema/auth.schema');
const SanitizeService = require('../../security/middleware/sanitize.service');

module.exports = async function (fastify, opts) {
    // Register route with schema validation and security middleware
    fastify.post('/register', {
        schema: authSchema.register, // Schema validation
        preHandler: SanitizeService.securityMiddleware,
        handler: AuthController.register // Controller function
    });

    // Login route
    fastify.post('/login', {
        schema: authSchema.login,
        preHandler: SanitizeService.securityMiddleware,
        handler: AuthController.login
    });
};