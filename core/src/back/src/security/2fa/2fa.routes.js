const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const dbApi = require('../../database/db.index');
const JWT = require('../middleware/jwt');

async function twofaRoutes(fastify, options) {
  
  fastify.post('/2fa/setup', {
    preHandler: JWT.authenticate,
    handler: async (request, reply) => {
      try {
        const user = request.user;
        if (!user?.id) return reply.code(401).send({ error: 'Unauthorized' });
    
        const row = dbApi.db.prepare('SELECT two_factor_enabled FROM users WHERE id = ?').get(user.id);
        if (row?.two_factor_enabled) {
          return reply.code(400).send({ error: '2FA déjà activée' });
        }
    
        const secret = speakeasy.generateSecret({
          name: `Transcendence (${user.username})`,
        });
    
        if (!secret.otpauth_url) throw new Error('Missing otpauth_url');
    
        dbApi.db.prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?')
          .run(secret.base32, user.id);
    
        const qrCode = await qrcode.toDataURL(secret.otpauth_url);
        return reply.send({ qrCode });
    
      } catch (err) {
        return reply.code(500).send({ error: 'Failed to setup 2FA' });
      }
    }
  });

}

module.exports = twofaRoutes;