const jwt = require('jsonwebtoken');

module.exports = async function authenticate(request, reply) {
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
};
