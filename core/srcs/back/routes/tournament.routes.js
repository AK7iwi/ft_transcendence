const { getUserByUsernameforMat } = require('../db');

async function tournamentRoutes(fastify, options) {
  fastify.post('/validate-username', {
    handler: async (request, reply) => {
      console.log('[ROUTE] /tournament/validate-username hit');
      const username = (request.body.username || '').trim();

      if (!username || typeof username !== 'string') {
        return reply.code(400).send({ valid: false, message: 'Username is required' });
      }

      try {
        const user = getUserByUsernameforMat(username);
        console.log('[CHECK] looking up username:', username, '→ found:', !!user);
        console.log('[CHECK] Result from DB for', username, ':', user);

        if (user) {
          return reply.send({
            valid: true,
            avatar: user.avatar || null // Make sure your DB returns an avatar field
          });
        } else {
          return reply.send({ valid: false, message: 'Username not found' });
        }
      } catch (err) {
        console.error('[Validate Username Error]', err);
        return reply.code(500).send({ valid: false, message: 'Internal server error' });
      }
    }
  });
}


module.exports = tournamentRoutes;