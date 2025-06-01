const AuthService = require('../services/auth.service');
const JWTService = require('../../security/middleware/jwt/jwt.service');

class AuthController {
    async register(request, reply) {
        try {
            const { username, password } = request.body;
            const user = await AuthService.registerUser(username, password, request.server.axios);

            return reply.code(200).send({
                success: true,
                message: 'Registration successful',
                data: {
                    user: {
                        username: user.username
                    }
                }
            });
        } catch (error) {
            return reply.code(400).send({
                success: false,
                message: error.message || 'Registration failed'
            });
        }
    }
    
    async login(request, reply) {
        try {
            const { username, password } = request.body;
            const user = await AuthService.loginUser(username, password, request.server.axios);
            
            const token = JWTService.generateJwtToken({
                id: user.id,
                username: user.username
            });

            // If 2FA is enabled, return a special response (without token)
            if (user.twoFactorEnabled) {
                return reply.code(200).send({
                    success: true,
                    message: '2FA required',
                    data: { twofa: true, userId: user.id, username: user.username }
                });
            }
      
            return reply.code(200).send({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        username: user.username,
                        token: token
                    }
                }
            });
      
        } catch (error) {
            request.log.error('Login error:', error);
            return reply.code(401).send({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();
