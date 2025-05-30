const AuthService = require('../services/auth.service');
const JWTService = require('../../security/middleware/jwt/jwt.service');

class AuthController {
    async register(request, reply) {
        try {
            const { username, password } = request.body;
            const userId = await AuthService.registerUser(username, password);

            return reply.code(200).send({
                success: true,
                message: 'User registered successfully',
                data: { username: username, userId: userId }
            });
        } catch (error) {
            request.log.error(error);
            return reply.code(400).send({
                success: false,
                message: error.message
            });
        }
    }
    
    async login(request, reply) {
        try {
            const { username, password } = request.body;
            const user = await AuthService.loginUser(username, password);
      
            // If 2FA is enabled, return a special response (without token)
            if (user.twoFactorEnabled) {
                return reply.code(200).send({
                    success: true,
                    message: '2FA required',
                    data: { twofa: true, userId: user.id, username: user.username }
                });
            }
      
            // Otherwise, classic login with JWT token
            const token = JWTService.generateToken({
                id: user.id,
                username: user.username
            });
      
            return reply.code(200).send({
                success: true,
                message: 'Login successful',
                data: { user: { username: user.username }, token }
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

// Export an instance of the controller instead of the class
module.exports = new AuthController();
