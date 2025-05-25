const jwt = require('jsonwebtoken');

class JWT {
    static async authenticate(request, reply) {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            request.user = decoded; // Important
        } catch (err) {
            console.error('[AUTH MIDDLEWARE]', err.message);
            return reply.code(401).send({ error: 'Invalid token' });
        }
    }

    static generateToken(userData) {
        return jwt.sign(
            userData,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    }

}

module.exports = JWT;