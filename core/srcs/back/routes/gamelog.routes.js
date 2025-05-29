//gamelog-route.js
const { db, recordGameResult } = require('../db');
const authenticate = require('../middleware/authenticate');

async function gameLogRoutes(fastify, options) {
  fastify.post('/game/result', {
    preHandler: [authenticate],
    handler: async (req, reply) => {
      const { winnerId, loserId } = req.body;

      if ((!winnerId && !loserId) || (winnerId && loserId && winnerId === loserId)) {
        return reply.status(400).send({ error: 'Missing or invalid winnerId/loserId' });
      }

      try {
        if (winnerId && !loserId) {
          db.prepare(`UPDATE users SET wins = wins + 1 WHERE id = ?`).run(winnerId);
        } else if (loserId && !winnerId) {
          db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`).run(loserId);
        } else {
          // cas normal avec les deux
          db.prepare(`INSERT INTO game_results (winner_id, loser_id) VALUES (?, ?)`).run(winnerId, loserId);
          db.prepare(`UPDATE users SET wins = wins + 1 WHERE id = ?`).run(winnerId);
          db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`).run(loserId);
        }

        return reply.send({ message: 'Game result recorded and stats updated' });
      } catch (err) {
        console.error('Error recording game result:', err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });
}


module.exports = gameLogRoutes;
