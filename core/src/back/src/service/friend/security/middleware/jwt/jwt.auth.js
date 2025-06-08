const JWTService = require('./jwt.service');

class JWTAuthentication {
    static async verifyJWTToken(request, reply) {
        try {
            // Get token from header
            const token = request.headers.authorization?.split(' ')[1];
            if (!token) {
                return reply.code(401).send({
                    success: false,
                    message: 'Authentication failed'
                });
            }

            // Verify token
            const decoded = JWTService.verifyJWTToken(token);
            
            // Add user info to request
            request.user = decoded;

            // Continue to the next middleware/route handler
            return;
        } catch (error) {
            return reply.code(401).send({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
}

module.exports = JWTAuthentication;