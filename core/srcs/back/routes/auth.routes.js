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
                
                // Ensure we're sending a proper JSON response
                return reply.code(200).send({ 
                    success: true, 
                    message: 'User registered successfully',
                    userId 
                });
            } catch (error) {
                fastify.log.error(error);
                // Ensure error response is properly formatted
                return reply.code(400).send({ 
                    success: false,
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
                console.log('Login attempt for user:', username); // Add logging
                
                const user = await AuthService.loginUser(username, password);
                console.log('Login successful for user:', username); // Add logging
                
                return reply.code(200).send({ 
                    success: true, 
                    message: 'Login successful',
                    user 
                });
            } catch (error) {
                console.error('Login error:', error); // Add logging
                return reply.code(401).send({ 
                    success: false,
                    error: error.message 
                });
            }
        }
    });
}

module.exports = authRoutes;