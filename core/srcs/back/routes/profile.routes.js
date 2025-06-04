// routes/profile.routes.js
const fp = require('fastify-plugin');
const SanitizeService = require('../middleware/security.middleware');
const authenticate = require('../middleware/authenticate');

module.exports = fp(async (fastify, opts) => {
  const { db } = require('../db');

  // ─── 1) Historique du profil connecté ───────────────────────────────────────
  fastify.get('/profile/history', {
    preHandler: [SanitizeService.sanitize, authenticate],
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;

        // 1.1) Matchs "locaux" (game_results)
        const localStmt = db.prepare(`
          SELECT
            gr.id                          AS match_id,
            gr.played_at                   AS played_at,
            CASE WHEN gr.winner_id = ? THEN 'win' ELSE 'loss' END AS result,
            u_opponent.username            AS opponent,
            NULL                           AS user_score,
            NULL                           AS opponent_score
          FROM game_results gr
          JOIN users u_opponent
            ON ( (gr.winner_id = ? AND gr.loser_id   = u_opponent.id)
               OR (gr.loser_id  = ? AND gr.winner_id = u_opponent.id) )
          WHERE gr.winner_id = ? OR gr.loser_id = ?
        `);

        // 1.2) Matchs "à distance" (remote_games)
        const remoteStmt = db.prepare(`
          SELECT
            rg.id                           AS match_id,
            rg.created_at                   AS played_at,
            CASE WHEN rg.winner_id = ? THEN 'win' ELSE 'loss' END AS result,
            u_opponent.username             AS opponent,
            CASE WHEN rg.player1_id = ?
                 THEN rg.score1
                 ELSE rg.score2 END          AS user_score,
            CASE WHEN rg.player1_id = ?
                 THEN rg.score2
                 ELSE rg.score1 END          AS opponent_score
          FROM remote_games rg
          JOIN users u_opponent
            ON ( (rg.player1_id = ? AND rg.player2_id = u_opponent.id)
               OR (rg.player2_id = ? AND rg.player1_id = u_opponent.id) )
          WHERE rg.player1_id = ? OR rg.player2_id = ?
        `);

        // 1.3) Matchs "tournoi" (tournament_matches + games)
        const tournamentStmt = db.prepare(`
          SELECT
            g.id                         AS match_id,
            g.created_at                 AS played_at,
            CASE WHEN g.winner_id = ? THEN 'win' ELSE 'loss' END AS result,
            u_opponent.username          AS opponent,
            CASE WHEN g.player1_id = ?
                 THEN g.score1
                 ELSE g.score2 END        AS user_score,
            CASE WHEN g.player1_id = ?
                 THEN g.score2
                 ELSE g.score1 END        AS opponent_score
          FROM tournament_matches tm
          JOIN games g
            ON tm.game_id = g.id
          JOIN users u_opponent
            ON ( (g.player1_id = ? AND g.player2_id = u_opponent.id)
               OR (g.player2_id = ? AND g.player1_id = u_opponent.id) )
          WHERE (g.player1_id = ? OR g.player2_id = ?)
        `);

        // Exécution des trois requêtes (on passe toujours userId pour chaque placeholder)
        const locals = localStmt.all(userId, userId, userId, userId, userId);
        const remotes = remoteStmt.all(
          userId, // CASE WHEN rg.winner_id = ?
          userId, // CASE WHEN rg.player1_id = ?
          userId, // CASE WHEN rg.player1_id = ?
          userId, // JOIN cond. : rg.player1_id = ?
          userId, // JOIN cond. : rg.player2_id = ?
          userId, // WHERE rg.player1_id = ?
          userId  // WHERE rg.player2_id = ?
        );
        const tournaments = tournamentStmt.all(
          userId, // CASE WHEN g.winner_id = ?
          userId, // CASE WHEN g.player1_id = ?
          userId, // CASE WHEN g.player1_id = ?
          userId, // JOIN cond. : g.player1_id = ?
          userId, // JOIN cond. : g.player2_id = ?
          userId, // WHERE g.player1_id = ?
          userId  // WHERE g.player2_id = ?
        );

        // 1.4) Fusion + tri + filtrage (on ne veut que les matches avec user_score non-null)
        const allMatches = [...locals, ...remotes, ...tournaments]
          .map(r => ({
            match_id: r.match_id,
            played_at: r.played_at,
            result: r.result,
            opponent: r.opponent,
            user_score: r.user_score,
            opponent_score: r.opponent_score
          }))
          .filter(r => r.user_score !== null) // on ne remonte que les lignes où user_score n'est pas null
          .sort((a, b) => new Date(b.played_at) - new Date(a.played_at));

        return reply.code(200).send(allMatches);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Impossible de charger l\'historique.' });
      }
    }
  });

  // ─── 2) Historique d'un ami (sur son profil) ─────────────────────────────────
  fastify.get('/auth/users/:id/history', {
    preHandler: [SanitizeService.sanitize, authenticate],
    handler: async (request, reply) => {
      try {
        // On récupère ici l'ID de l'ami (paramètre dans l'URL)
        const friendId = Number(request.params.id);

        // 2.1) Matchs "locaux" (game_results) de l'ami
        const localStmt = db.prepare(`
          SELECT
            gr.id                          AS match_id,
            gr.played_at                   AS played_at,
            CASE WHEN gr.winner_id = ? THEN 'win' ELSE 'loss' END AS result,
            u_opponent.username            AS opponent,
            NULL                           AS user_score,
            NULL                           AS opponent_score
          FROM game_results gr
          JOIN users u_opponent
            ON ( (gr.winner_id = ? AND gr.loser_id   = u_opponent.id)
               OR (gr.loser_id  = ? AND gr.winner_id = u_opponent.id) )
          WHERE gr.winner_id = ? OR gr.loser_id = ?
        `);

        // 2.2) Matchs "à distance" (remote_games) de l'ami
        const remoteStmt = db.prepare(`
          SELECT
            rg.id                          AS match_id,
            rg.created_at                  AS played_at,
            CASE WHEN rg.winner_id = ? THEN 'win' ELSE 'loss' END AS result,
            u_opponent.username            AS opponent,
            CASE WHEN rg.player1_id = ?
                 THEN rg.score1
                 ELSE rg.score2 END         AS user_score,
            CASE WHEN rg.player1_id = ?
                 THEN rg.score2
                 ELSE rg.score1 END         AS opponent_score
          FROM remote_games rg
          JOIN users u_opponent
            ON ( (rg.player1_id = ? AND rg.player2_id = u_opponent.id)
               OR (rg.player2_id = ? AND rg.player1_id = u_opponent.id) )
          WHERE rg.player1_id = ? OR rg.player2_id = ?
        `);

        // 2.3) Matchs "tournoi" (tournament_matches + games) de l'ami
        const tournamentStmt = db.prepare(`
          SELECT
            g.id                         AS match_id,
            g.created_at                 AS played_at,
            CASE WHEN g.winner_id = ? THEN 'win' ELSE 'loss' END AS result,
            u_opponent.username          AS opponent,
            CASE WHEN g.player1_id = ?
                 THEN g.score1
                 ELSE g.score2 END        AS user_score,
            CASE WHEN g.player1_id = ?
                 THEN g.score2
                 ELSE g.score1 END        AS opponent_score
          FROM tournament_matches tm
          JOIN games g
            ON tm.game_id = g.id
          JOIN users u_opponent
            ON ( (g.player1_id = ? AND g.player2_id = u_opponent.id)
               OR (g.player2_id = ? AND g.player1_id = u_opponent.id) )
          WHERE (g.player1_id = ? OR g.player2_id = ?)
        `);

        // Exécution des trois requêtes pour friendId
        const locals = localStmt.all(friendId, friendId, friendId, friendId, friendId);
        const remotes = remoteStmt.all(
          friendId, // winner_id ?
          friendId, // player1_id ?
          friendId, // player1_id ?
          friendId, // JOIN cond. : player1_id
          friendId, // JOIN cond. : player2_id
          friendId, // WHERE player1_id
          friendId  // WHERE player2_id
        );
        const tournaments = tournamentStmt.all(
          friendId, // winner_id ?
          friendId, // player1_id ?
          friendId, // player1_id ?
          friendId, // JOIN cond. : player1_id
          friendId, // JOIN cond. : player2_id
          friendId, // WHERE player1_id
          friendId  // WHERE player2_id
        );

        // Fusion + tri + filtrage (uniquement user_score non-null)
        const allMatches = [...locals, ...remotes, ...tournaments]
          .map(r => ({
            match_id: r.match_id,
            played_at: r.played_at,
            result: r.result,
            opponent: r.opponent,
            user_score: r.user_score,
            opponent_score: r.opponent_score
          }))
          .filter(r => r.user_score !== null)
          .sort((a, b) => new Date(b.played_at) - new Date(a.played_at));

        return reply.code(200).send(allMatches);
      } catch (err) {
        request.log.error(err);
        return reply.code(500).send({ error: 'Impossible de charger l\'historique de cet utilisateur.' });
      }
    }
  });
});
