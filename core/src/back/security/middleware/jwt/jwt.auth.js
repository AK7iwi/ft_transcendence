const JWTService = require('./jwt.service');

class JWTAuthentication {
    static async verifyJWTToken(request, reply) { //check param 
        try {
            // Get token from header
            const token = request.headers.authorization?.split(' ')[1];
            if (!token) { //throw an error from error.js
                return reply.code(401).send({
                    success: false,
                    message: 'Authentication failed'
                });
            }

            const decoded = JWTService.verifyJWTToken(token);
            request.user = decoded;

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