const AuthService = require('../services/auth.service');
const authSchema = require('../schemas/auth.schema');
const jwt = require('jsonwebtoken');


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

    fastify.get('/me', {
  preHandler: [fastify.authenticate],
  handler: async (request, reply) => {
    const user = request.user;
    return { id: user.id, username: user.username };
  }
});

// Login user
fastify.post('/login', {
    schema: authSchema.login,
    handler: async (request, reply) => {
        try {
            const { username, password } = request.body;
            const user = await AuthService.loginUser(username, password);

            // ✅ Générer un token JWT
            const token = jwt.sign(
                { id: user.id, username: user.username },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            return reply.code(200).send({ 
                success: true, 
                message: 'Login successful',
                token,             // ✅ retourne le token
                username: user.username,
                userId: user.id
            });
        } catch (error) {
            console.error('Login error:', error);
            return reply.code(401).send({ 
                success: false,
                error: error.message 
            });
        }
    }
});

}

module.exports = authRoutes;