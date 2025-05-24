const AuthService = require('./auth.service');
const authSchema = require('./auth.schema');
const Security = require('../security/middleware/sanityze');
const JWT = require('../security/middleware/jwt');

async function authRoutes(fastify, options) {

  fastify.post('/register', {
    schema: authSchema.register,
    preHandler: Security.securityMiddleware,
    handler: async (request, reply) => {
      try {
        const { username, password } = request.body;
        const userId = await AuthService.registerUser(username, password);

        return reply.code(200).send({
          success: true,
          message: 'User registered successfully',
          data: {
            id: userId,
            username
          }
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          message: error.message
        });
      }
    }
  });

  fastify.post('/login', {
    schema: authSchema.login,
    preHandler: Security.securityMiddleware,
    handler: async (request, reply) => {
      try {
        const { username, password } = request.body;
        const user = await AuthService.loginUser(username, password);
  
        // 🔒 Si 2FA activée, renvoie une réponse spéciale (sans token)
        if (user.twoFactorEnabled) {
          return reply.code(200).send({
            success: true,
            message: '2FA required',
            data: {
              twofa: true,
              userId: user.id,
              username: user.username
            }
          });
        }
  
        // 🔓 Sinon, login classique avec token JWT
        const token = JWT.generateToken({
          id: user.id,
          username: user.username
        });
  
        return reply.code(200).send({
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: user.id,
              username: user.username
            },
            token
          }
        });
  
      } catch (error) {
        console.error('Login error:', error);
        return reply.code(401).send({
          success: false,
          message: error.message
        });
      }
    }
  });

}

module.exports = authRoutes;