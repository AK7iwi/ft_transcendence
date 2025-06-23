const DbTournament = require('../database/db.tournament');

class TournamentService {
    static async createGameResult(winnerId, loserId) {
        try {
            await DbTournament.createGameResult(winnerId, loserId);
        } catch (err) {
            throw err;
        }
    }

    static async createMatchHistory(userId, opponent, result, scoreUser, scoreOpponent) {
        try {
            await DbTournament.createMatchHistory(userId, opponent, result, scoreUser, scoreOpponent);
        } catch (err) {
            throw err;
        }
    }

    static async validateUsername(username) {
        try {
            const user = await DbTournament.getUserByUsername(username);
            
            if (user) {
                return {
                    valid: true,
                    id: user.id,
                    avatar: user.avatar || null, 
                    wins: user.wins,
                    losses: user.losses
                };
            } else {
                return { valid: false, message: 'Username not found' };
            }
        } catch (err) {
            throw err;
        }
    }
}

module.exports = TournamentService;