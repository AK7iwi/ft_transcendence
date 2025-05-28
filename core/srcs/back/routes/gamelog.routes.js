//gamelog-route.js
const { db, recordGameResult } = require('../db');
const authenticate = require('../middleware/authenticate');

async function gameLogRoutes(fastify, options) {
  fastify.post('/game/result', {
    preHandler: [authenticate],
    handler: async (req, reply) => {
      const { winnerId, loserId } = req.body;

      // 🔒 Cas non valide : aucun ID ou même ID deux fois
      if ((!winnerId && !loserId) || (winnerId && loserId && winnerId === loserId)) {
        return reply.status(400).send({ error: 'Missing or invalid winnerId/loserId' });
      }

      try {
        if (winnerId && loserId) {
          // 🎮 Partie entre deux vrais joueurs
          recordGameResult(winnerId, loserId);
          db.prepare(`UPDATE users SET wins = wins + 1 WHERE id = ?`).run(winnerId);
          db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`).run(loserId);
        } else if (winnerId) {
          // 🧠 Partie solo gagnée (vs bot)
          db.prepare(`UPDATE users SET wins = wins + 1 WHERE id = ?`).run(winnerId);
        } else if (loserId) {
          // 💀 Partie solo perdue
          db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`).run(loserId);
        }

        return reply.send({ message: 'Game result recorded and stats updated' });
      } catch (err) {
        console.error('❌ Error recording game result:', err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });
}


module.exports = gameLogRoutes;
