const AuthService = require('./auth.service');
const JWT = require('../security/jwt');
const Security = require('../security/sanityze');
const dbApi = require('../database/db.index');
const UserDB = require('../database/db.user');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

async function authRoutes(fastify, options) {

  fastify.post('/register', {
    preHandler: Security.securityMiddleware,
    handler: async (request, reply) => {
      try {
        const { username, password } = request.body;
        const result = await AuthService.registerUser(username, password);

        return reply.code(200).send({
          success: true,
          message: 'User registered successfully',
          data: result
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  });

  fastify.post('/login', {
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
            twofa: true,
            userId: user.id,
            username: user.username
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
          token,
          user: {
            id: user.id,
            username: user.username
          }
        });
  
      } catch (error) {
        console.error('Login error:', error);
        return reply.code(401).send({
          success: false,
          error: error.message
        });
      }
    }
  });

}

module.exports = authRoutes;