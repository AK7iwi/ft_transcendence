const AuthService = require('../services/auth.service');

async function authRoutes(fastify, options) {
    // Register new user
    fastify.post('/register', async (request, reply) => {
        try {
            const { username, email, password } = request.body;
            
            // Basic validation
            if (!username || !email || !password) {
                return reply.code(400).send({ 
                    error: 'Username, email and password are required' 
                });
            }

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
    });

    // Login user
    fastify.post('/login', async (request, reply) => {
        try {
            const { username, password } = request.body;
            
            // Basic validation
            if (!username || !password) {
                return reply.code(400).send({ 
                    error: 'Username and password are required' 
                });
            }

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
    });
}

module.exports = authRoutes;