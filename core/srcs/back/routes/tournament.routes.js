// routes/tournament.routes.js
const fp = require('fastify-plugin');
const { getUserByUsernameforMat, recordGameResult, db } = require('../db');
const SanitizeService = require('../middleware/security.middleware');
const authenticate = require('../middleware/authenticate');

module.exports = fp(async (fastify, opts) => {
  // --- 1) Validation du pseudo pour le tournoi ---
  fastify.post('/tournament/validate-username', {
    preHandler: [SanitizeService.sanitize, authenticate],
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
            avatar: user.avatar || null // s'assure que "avatar" existe en table users
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
  });

  fastify.post('/tournament/create', {
    preHandler: [SanitizeService.sanitize, authenticate],
    handler: async (request, reply) => {
      const { name } = request.body;
      if (!name || typeof name !== 'string') {
        return reply.code(400).send({ error: 'Tournament name required' });
      }
      // Insérer dans la table `tournaments`
      const insert = db.prepare(`
        INSERT INTO tournaments (name, status)
        VALUES (?, 'pending')
      `);
      const result = insert.run(name);
      // `result.lastInsertRowid` est l'ID du nouveau tournoi
      return reply.code(201).send({ id: result.lastInsertRowid });
    }
  });

  // --- 2) Enregistrement d'un résultat de match ---
  // Cette route est protégée par fastify.authenticate
  fastify.post('/tournament/game/result', {
    preHandler: [SanitizeService.sanitize, authenticate],
    handler: async (request, reply) => {
      // @ts-ignore : on ne typage pas le body ici
      const { winnerId, loserId } = request.body;

      if (
        typeof winnerId !== 'number' ||
        typeof loserId !== 'number'
      ) {
        return reply
          .code(400)
          .send({ error: 'winnerId et loserId requis (number).' });
      }

      try {
        // 1) Inserer dans game_results
        recordGameResult(winnerId, loserId);

        // 2) Mettre à jour wins / losses pour chaque utilisateur
        db.prepare(`UPDATE users SET wins   = wins   + 1 WHERE id = ?`)
          .run(winnerId);
        db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`)
          .run(loserId);

        return reply
          .code(201)
          .send({ message: 'Résultat enregistré.' });
      } catch (err) {
        request.log.error(err);
        return reply
          .code(500)
          .send({ error: 'Impossible d\'enregistrer le résultat.' });
      }
    }
  });

  fastify.post('/tournament/save-remote-game', {
    preHandler: [SanitizeService.sanitize, authenticate],
    handler: async (request, reply) => {
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

      // 1) Vérifications basiques
      if (
        typeof tournamentId !== 'number' ||
        typeof round !== 'number' ||
        typeof matchNumber !== 'number' ||
        typeof player1Id !== 'number' ||
        typeof player2Id !== 'number' ||
        typeof score1 !== 'number' ||
        typeof score2 !== 'number' ||
        typeof winnerId !== 'number'
      ) {
        return reply.code(400).send({ error: 'Données du match invalides ou manquantes.' });
      }

      try {
        // 2) Insérer dans `remote_games`
        const insertRemote = db.prepare(`
          INSERT INTO remote_games
            (player1_id, player2_id, score1, score2, winner_id)
          VALUES (?, ?, ?, ?, ?)
        `);
        const remoteInfo = insertRemote.run(player1Id, player2Id, score1, score2, winnerId);
        const remoteGameId = remoteInfo.lastInsertRowid;

        // 3) Insérer dans `game_results` pour comptabiliser wins/losses
        const insertResult = db.prepare(`
          INSERT INTO game_results (winner_id, loser_id)
          VALUES (?, ?)
        `);
        const loserId = (winnerId === player1Id ? player2Id : player1Id);
        insertResult.run(winnerId, loserId);

        // 4) Mettre à jour les compteurs wins/losses dans `users`
        db.prepare(`UPDATE users SET wins   = wins   + 1 WHERE id = ?`).run(winnerId);
        db.prepare(`UPDATE users SET losses = losses + 1 WHERE id = ?`).run(loserId);

        // 5) Insérer dans `tournament_matches` pour lier ce match au tournoi
        const insertTMatch = db.prepare(`
          INSERT INTO tournament_matches
            (tournament_id, game_id, round, match_number)
          VALUES (?, ?, ?, ?)
        `);
        // `game_id` peut être l'ID dans `games`, si vous avez également créé un "jeu" dans cette table.
        // Ici, on pourrait soit :
        //   – créer d'abord un enregistrement dans `games` puis récupérer son id, 
        //   – soit réutiliser `remoteGameId` en tant que "game_id" si vous voulez le simplifier.
        // Supposons que vous vouliez une table `games` distincte :
        //   const insertGame = db.prepare(`
        //     INSERT INTO games (player1_id, player2_id, winner_id, score1, score2, status)
        //     VALUES (?, ?, ?, ?, ?, 'finished')
        //   `);
        //   const gameInfo = insertGame.run(player1Id, player2Id, winnerId, score1, score2);
        //   const gameId = gameInfo.lastInsertRowid;
        //
        //   insertTMatch.run(tournamentId, gameId, round, matchNumber);

        // Si vous souhaitez simplement réutiliser remoteGameId, faites :
        insertTMatch.run(tournamentId, remoteGameId, round, matchNumber);

        return reply.code(201).send({ message: 'Match de tournoi enregistré.' });
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Impossible d\'enregistrer le match de tournoi.' });
      }
    }
  });
});
