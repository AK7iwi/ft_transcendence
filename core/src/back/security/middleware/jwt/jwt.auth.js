const JWTService = require('./jwt.service');

class JWTAuthentication {
    static async verifyJWTToken(request, reply) {
        try {
            // Get token from header
            const token = request.headers.authorization?.split(' ')[1];
            if (!token) {
                throw new Error('No token provided');
            }

            // Verify token
            const decoded = JWTService.verifyJWTToken(token);
            
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

module.exports = JWTAuthentication;