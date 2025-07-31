const AuthService = require('./auth.service');
const JWTService = require('../security/middleware/jwt/jwt.service');

class AuthController {
    async register(request, reply) {
        const { username, password } = request.body;

        await AuthService.checkIfUserExists(username, false);
        const user = await AuthService.createUser(username, password);
        await AuthService.createUserInOtherServices(user, request.server.serviceClient);

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

        const user = await AuthService.checkIfUserExists(username, true);
        await AuthService.checkPassword(password, user.password);
        const token = JWTService.generateJWTToken(user);

        // If 2FA is enabled, return a special response
        if (user.two_factor_enabled) {
            return reply.code(201).send({
                success: true,
                message: '2FA required',
                data: { 
                    username: user.username,
                    twofa: true
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
