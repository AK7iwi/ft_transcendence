// routes/tournament.routes.js
const fp = require('fastify-plugin');
const { getUserByUsernameforMat, recordGameResult, db } = require('../db');

module.exports = fp(async (fastify, opts) => {
  // --- 1) Validation du pseudo pour le tournoi ---
  fastify.post(
    '/tournament/validate-username',
    {
      handler: async (request, reply) => {
        console.log('[ROUTE] /tournament/validate-username hit');
        const username = (request.body?.username || '').trim();

        if (!username || typeof username !== 'string') {
          return reply
            .code(400)
            .send({ valid: false, message: 'Username is required' });
        }

        try {
          const user = getUserByUsernameforMat(username);
          console.log(
            '[CHECK] looking up username:',
            username,
            '→ found:',
            !!user
          );

          if (user) {
            return reply.send({
              valid: true,
              id: user.id,
              avatar: user.avatar || null // s’assure que "avatar" existe en table users
            });
          } else {
            return reply.send({
              valid: false,
              message: 'Username not found'
            });
          }
        } catch (err) {
          console.error('[Validate Username Error]', err);
          return reply
            .code(500)
            .send({ valid: false, message: 'Internal server error' });
        }
      }
    }
  );

// routes/tournament.routes.js
fastify.post(
  '/tournament/save-remote-game',
  { preHandler: fastify.authenticate },
  async (request, reply) => {
    const {
      tournamentId,
      round,
      matchNumber,
      player1Id,
      player2Id,
      score1,
      score2,
      winnerId
    } = request.body;

    try {
      // 1) INSERT dans remote_games
      const insertRemote = db.prepare(`
        INSERT INTO remote_games
          (player1_id, player2_id, score1, score2, winner_id)
        VALUES (?, ?, ?, ?, ?)
      `);
      const remoteInfo = insertRemote.run(player1Id, player2Id, score1, score2, winnerId);
      const remoteGameId = remoteInfo.lastInsertRowid;

      // 2) INSERT dans game_results : le trigger fait l’incrément de wins/losses
      const loserId = (winnerId === player1Id ? player2Id : player1Id);
      db.prepare(`
        INSERT INTO game_results (winner_id, loser_id)
        VALUES (?, ?)
      `).run(winnerId, loserId);

      // 3) INSERT dans tournament_matches
      const insertTMatch = db.prepare(`
        INSERT INTO tournament_matches
          (tournament_id, game_id, round, match_number)
        VALUES (?, ?, ?, ?)
      `);
      insertTMatch.run(tournamentId, remoteGameId, round, matchNumber);

      return reply.code(201).send({ message: 'Match de tournoi enregistré.' });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ error: 'Impossible d’enregistrer le match de tournoi.' });
    }
  }
);
}
