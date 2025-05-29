const authSchema = require('../schema/auth.schema');
const AuthController = require('../controllers/auth.controller');

module.exports = async function (fastify, opts) {
    // Register route
    fastify.post('/register', {
        schema: authSchema.register, 
        handler: AuthController.register
    });

    // Login route
    fastify.post('/login', {
        schema: authSchema.login,
        handler: AuthController.login
    });
};