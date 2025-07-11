const AuthController = require('./auth.controller');

module.exports = async function (fastify, opts) {    
    // Register route
    fastify.post('/register', {
        handler: AuthController.register
    });

    // Login route
    fastify.post('/login', {
        handler: AuthController.login
    });
};