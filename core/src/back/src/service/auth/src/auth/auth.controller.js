const AuthService = require('./auth.service');
const JWTService = require('../security/middleware/jwt/jwt.service');

class AuthController {
    
    async register(request, reply) {
        const { username, password } = request.body;
        const user = await AuthService.registerUser(username, password, request.server.serviceClient);

        console.log('===================================');
        console.log(`[AUTH CONTROLLER] User registration attempt - username: ${username} - User does not exist, proceeding with registration`);
        console.log('===================================');

        return reply.code(201).send({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    username: user.username
                }
            }
        });
    }
    
    async login(request, reply) {
        const { username, password } = request.body;
        const user = await AuthService.loginUser(username, password);
        const token = JWTService.generateJWTToken({id: user.id, username: user.username});

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
                    username: user.username,
                    token: token
                }
            }
        });
    }
}

module.exports = new AuthController();
