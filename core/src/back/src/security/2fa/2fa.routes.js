const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const dbApi = require('../../database/db.index');
const JWT = require('../middleware/jwt');
const Security = require('../middleware/sanityze');
const twoFactorSchema = require('./2fa.schema');

async function twofaRoutes(fastify, options) {
  
  fastify.post('/2fa/setup', {
    schema: twoFactorSchema.setup,
    preHandler: [Security.securityMiddleware, JWT.authenticate],
    handler: async (request, reply) => {
      try {
        const user = request.user;
        if (!user?.id) {
          return reply.code(401).send({
            success: false,
            message: 'Unauthorized'
          });
        }
    
        const row = dbApi.db.prepare('SELECT two_factor_enabled FROM users WHERE id = ?').get(user.id);
        if (row?.two_factor_enabled) {
          return reply.code(400).send({
            success: false,
            message: '2FA déjà activée'
          });
        }
    
        const secret = speakeasy.generateSecret({
          name: `Transcendence (${user.username})`,
        });
    
        if (!secret.otpauth_url) throw new Error('Missing otpauth_url');
    
        dbApi.db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?')
          .run(secret.base32, user.id);
    
        const qrCode = await qrcode.toDataURL(secret.otpauth_url);
        return reply.code(200).send({
          success: true,
          message: '2FA setup initiated',
          data: {
            qrCode
          }
        });
    
      } catch (err) {
        fastify.log.error('[2FA SETUP ERROR]', err);
        return reply.code(500).send({
          success: false,
          message: 'Failed to setup 2FA'
        });
      }
    }
  });

  fastify.post('/2fa/verify', {
    schema: twoFactorSchema.verify,
    preHandler: [Security.securityMiddleware, JWT.authenticate],
    handler: async (request, reply) => {
      try {
        const { token } = request.body;
        const userId = request.user.id;

        if (!token) {
          return reply.code(400).send({
            success: false,
            message: 'Token is required'
          });
        }

        const row = dbApi.db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(userId);
        if (!row || !row.two_factor_secret) {
          return reply.code(400).send({
            success: false,
            message: '2FA secret not found'
          });
        }

        const verified = speakeasy.totp.verify({
          secret: row.two_factor_secret,
          encoding: 'base32',
          token,
          window: 1
        });

        if (!verified) {
          return reply.code(401).send({
            success: false,
            message: 'Invalid 2FA token'
          });
        }

        dbApi.db.prepare('UPDATE users SET two_factor_enabled = 1 WHERE id = ?').run(userId);
        return reply.code(200).send({
          success: true,
          message: '2FA verification successful'
        });
      } catch (err) {
        fastify.log.error('[2FA VERIFY ERROR]', err);
        return reply.code(500).send({
          success: false,
          message: 'Failed to verify 2FA'
        });
      }
    }
  });

  fastify.post('/2fa/verify-login', {
    schema: twoFactorSchema.verifyLogin,
    preHandler: [Security.securityMiddleware],
    handler: async (request, reply) => {
      try {
        const { userId, token: code } = request.body;

        if (!userId || !code) {
          return reply.code(400).send({
            success: false,
            message: 'Missing userId or token'
          });
        }

        const row = dbApi.db.prepare('SELECT two_factor_secret FROM users WHERE id = ?').get(userId);
        if (!row || !row.two_factor_secret) {
          return reply.code(400).send({
            success: false,
            message: '2FA not configured for this user'
          });
        }

        const verified = speakeasy.totp.verify({
          secret: row.two_factor_secret,
          encoding: 'base32',
          token: code,
          window: 1
        });

        if (!verified) {
          return reply.code(401).send({
            success: false,
            message: 'Invalid 2FA token'
          });
        }

        const token = JWT.sign(
          { id: userId },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const user = dbApi.db.prepare('SELECT username FROM users WHERE id = ?').get(userId);

        return reply.code(200).send({
          success: true,
          message: '2FA login verification successful',
          data: {
            token,
            user: {
              id: userId,
              username: user.username
            }
          }
        });

      } catch (err) {
        fastify.log.error('[2FA VERIFY LOGIN ERROR]', err);
        return reply.code(500).send({
          success: false,
          message: 'Failed to verify 2FA login'
        });
      }
    }
  });

}

module.exports = twofaRoutes;