const DbTournament = require('../database/db.tournament');

class TournamentService {
    static async createGameResult(winnerId, loserId) {
        try {
            await DbTournament.createGameResult(winnerId, loserId);
        } catch (err) {
            throw err;
        }
    }

    static async createMatchHistory(userId, opponent, result, scoreUser, scoreOpponent, serviceClient) {
        try {
            const playedAt = new Date().toISOString();
            await DbTournament.createMatchHistory(userId, opponent, result, scoreUser, scoreOpponent, playedAt);

            // Notify user service to create match history
            await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/createMatchHistory`, {
                userId,
                opponent,
                result,
                scoreUser,
                scoreOpponent,
                playedAt
            });
        } catch (err) {
            throw err;
        }
    }

    static async createGameResultWithMatchHistory(winnerId, loserId, scoreWinner, scoreLoser, serviceClient) {
        try {
            // Create game result in tournament service
            await DbTournament.createGameResult(winnerId, loserId);
            
            // Get user information for both players
            const winner = await DbTournament.getUserById(winnerId);
            const loser = await DbTournament.getUserById(loserId);
            
            if (!winner || !loser) {
                throw new Error('User not found');
            }
            
            const playedAt = new Date().toISOString();
            
            // Create match history for winner
            await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/createMatchHistory`, {
                userId: winnerId,
                opponent: loser.username,
                result: 'win',
                scoreUser: scoreWinner,
                scoreOpponent: scoreLoser,
                playedAt
            });
            
            // Create match history for loser
            await serviceClient.post(`${process.env.USER_SERVICE_URL}/internal/createMatchHistory`, {
                userId: loserId,
                opponent: winner.username,
                result: 'loss',
                scoreUser: scoreLoser,
                scoreOpponent: scoreWinner,
                playedAt
            });
        } catch (err) {
            throw err;
        }
    }

    static async validateUsername(username) {
        try {
            const user = await DbTournament.getUserByUsername(username);
            if (!user) {
                throw new Error('User not found');
            }
            
            return {
                    id: user.id,
                    avatar: user.avatar || null, 
                    wins: user.wins,
                    losses: user.losses
            };

        } catch (err) {
            throw err;
        }
    }
}

module.exports = TournamentService;