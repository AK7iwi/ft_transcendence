const JWTService = require('../../security/middleware/jwt.service');

class AuthMiddleware {
    static async verifyToken(request, reply) {
        try {
            // Get token from header
            const token = request.headers.authorization?.split(' ')[1];
            if (!token) {
                throw new Error('No token provided');
            }

            // Verify token
            const decoded = JWTService.verifyToken(token);
            
            // Add user info to request
            request.user = decoded;
        } catch (error) {
            reply.code(401).send({ 
                success: false,
                message: 'Unauthorized'
            });
        }
    }
}

module.exports = AuthMiddleware;