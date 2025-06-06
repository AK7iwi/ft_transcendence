// → routes/gamelog.routes.js

const { db } = require('../db');
const authenticate = require('../middleware/authenticate');

async function gameLogRoutes(fastify, options) {
  fastify.post('/game/result', {
    preHandler: [authenticate],
    handler: async (req, reply) => {
      const { winnerId, loserId } = req.body;

      // Validation : on exige exactement l’un ou l’autre, pas les deux et pas aucun.
      const hasWinner = typeof winnerId === 'number';
      const hasLoser  = typeof loserId  === 'number';
      if ((hasWinner && hasLoser) || (!hasWinner && !hasLoser)) {
        return reply
          .status(400)
          .send({ error: 'Vous devez fournir soit winnerId, soit loserId (pas les deux).' });
      }
      console.log('[DEBUG] inserting game_results:', {
  winnerParam: hasWinner ? winnerId : null,
  loserParam:  hasLoser  ? loserId  : null
});

      try {
        // Insère dans game_results en laissant l’autre colonne à NULL
        db.prepare(`
          INSERT INTO game_results (winner_id, loser_id)
          VALUES (?, ?)
        `).run(
          hasWinner ? winnerId : null,
          hasLoser  ? loserId  : null
        );

        return reply.send({
          message: 'Résultat enregistré, stats mises à jour par trigger.'
        });
      } catch (err) {
        console.error('Error recording game result:', err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  });
}

module.exports = gameLogRoutes;