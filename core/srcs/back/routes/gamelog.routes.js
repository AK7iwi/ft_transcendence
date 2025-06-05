// → routes/gamelog.routes.js

const { db } = require('../db');
const authenticate = require('../middleware/authenticate');

async function gameLogRoutes(fastify, options) {
  // On est à l’intérieur d’une fonction où 'fastify' est bien défini
  fastify.post(
    '/game/result',
    {
      preHandler: [authenticate],
    },
    async (req, reply) => {
      const { winnerId, loserId } = req.body;

      // Validation : il faut exactement winnerId ou loserId, pas les deux
      if (
        (typeof winnerId !== 'number' && typeof loserId !== 'number') ||
        (typeof winnerId === 'number' && typeof loserId === 'number' && winnerId === loserId)
      ) {
        return reply.status(400).send({ error: 'Missing or invalid winnerId/loserId' });
      }

      try {
        if (typeof winnerId === 'number' && typeof loserId !== 'number') {
          // Si seul winnerId fourni
          db.prepare(`UPDATE users SET wins = wins + 1 WHERE id = ?`).run(winnerId);
        } else if (typeof loserId === 'number' && typeof winnerId !== 'number') {
          // Si seul loserId fourni
          db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`).run(loserId);
        } else {
          // Cas bilatéral (match “officiel” avec les deux IDs)
          db.prepare(`INSERT INTO game_results (winner_id, loser_id) VALUES (?, ?)`).run(
            winnerId,
            loserId
          );
          db.prepare(`UPDATE users SET wins = wins + 1 WHERE id = ?`).run(winnerId);
          db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`).run(loserId);
        }

        return reply.send({ message: 'Game result recorded and stats updated' });
      } catch (err) {
        console.error('Error recording game result:', err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

module.exports = gameLogRoutes;
