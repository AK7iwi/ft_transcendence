const AuthService = require('../services/auth.service');
const authSchema = require('../schemas/auth.schema');

async function authRoutes(fastify, options) {
    // Register new user
    fastify.post('/register', {
        schema: authSchema.register,
        handler: async (request, reply) => {
            try {
                const { username, email, password } = request.body;
                const userId = await AuthService.registerUser(username, email, password);
                return { 
                    success: true, 
                    message: 'User registered successfully',
                    userId 
                };
            } catch (error) {
                fastify.log.error(error);
                return reply.code(400).send({ 
                    error: error.message 
                });
            }
        }
    });

    // Login user
    fastify.post('/login', {
        schema: authSchema.login,
        handler: async (request, reply) => {
            try {
                const { username, password } = request.body;
                const user = await AuthService.loginUser(username, password);
                return { 
                    success: true, 
                    message: 'Login successful',
                    user 
                };
            } catch (error) {
                fastify.log.error(error);
                return reply.code(401).send({ 
                    error: error.message 
                });
            }
        }
    });
}

module.exports = authRoutes;