const AuthService = require('./auth.service');
const authSchema = require('./auth.schema');
const JWT = require('../security/jwt');
const Security = require('../security/sanityze');
const dbApi = require('../database/db.index');
const UserDB = require('../database/db.user');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

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
          userId
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
}

module.exports = authRoutes;