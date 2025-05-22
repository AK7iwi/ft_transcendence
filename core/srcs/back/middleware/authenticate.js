const jwt = require('jsonwebtoken');


function authenticate(request, reply, done) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.code(401).send({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
    done();
  } catch (err) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}

module.exports = authenticate;