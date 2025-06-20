const DbUser = require('../database/db.user');

class UserService {
    static async getUser(id) {
        try {
            const user = await DbUser.getUser(id);

            return {
                id: user.user_id,
                username: user.username,
                avatar: user.avatar,
                twoFactorEnabled: !!user.two_factor_enabled,
                wins: user.wins,
                losses: user.losses
            };
        } catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }

    static async getMatchHistory(userId) {
        try {
            return await DbUser.getMatchHistory(userId);
        } catch (error) {
            throw new Error('Failed to retrieve match history');
        }
    }

    static async getUserStats(userId) {
        try {
            return await DbUser.getUserStats(userId);
        } catch (error) {
            throw new Error('Failed to retrieve user stats');
        }
    }
}

module.exports = UserService;