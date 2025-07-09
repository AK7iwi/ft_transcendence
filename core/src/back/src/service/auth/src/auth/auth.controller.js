const AuthService = require('./auth.service');
const JWTService = require('../security/middleware/jwt/jwt.service');
const ErrorHandler = require('../utils/error/error-handler');

class AuthController {
    
    async register(request, reply) {
        try {
            const { username, password } = request.body;

            const user = await AuthService.registerUser(username, password, request.server.serviceClient);

            return reply.code(201).send({
                success: true,
                message: 'Registration successful',
                data: {
                    user: {
                        id: user.id,
                        username: user.username
                    }
                }
            });
        } catch (error) {
            return ErrorHandler.handle(error, request, reply);
        }
    }
    
    async login(request, reply) {
        try {
            const { username, password } = request.body;
            
            const user = await AuthService.loginUser(username, password);
            
            const token = JWTService.generateJWTToken({
                id: user.id,
                username: user.username
            });

            // If 2FA is enabled, return a special response
            if (user.twoFactorEnabled) {
                return reply.code(201).send({
                    success: true,
                    message: '2FA required',
                    data: { 
                        twofa: true, 
                        userId: user.id, 
                        username: user.username 
                    }
                });
            }
      
            return reply.code(200).send({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        token: token
                    }
                }
            });
        } catch (error) {
            return ErrorHandler.handle(error, request, reply);
        }
    }
}

module.exports = new AuthController();
