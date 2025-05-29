const JwtService = require('./jwt.service');

class JwtAuth {
    static async verifyToken(request, reply) {
        try {
            // Get token from header
            const token = request.headers.authorization?.split(' ')[1];
            if (!token) {
                throw new Error('No token provided');
            }

            // Verify token
            const decoded = JwtService.verifyToken(token);
            
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

module.exports = JwtAuth;