const jwt = require('jsonwebtoken');

class JwtService {
    static generateToken(user) {
        return jwt.sign(
            { 
                id: user.id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN}
        );
    }

    static verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = JwtService;