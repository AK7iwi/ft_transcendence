const AuthController = require('../controllers/auth.controller');
const authSchema = require('../schema/auth.schema');

module.exports = async function (fastify, opts) {
    // Register route with schema validation and security middleware
    fastify.post('/register', {
        schema: authSchema.register,    // Schema validation
        handler: AuthController.register // Controller function
    });

    // Login route
    fastify.post('/login', {
        schema: authSchema.login,
        handler: AuthController.login
    });
};