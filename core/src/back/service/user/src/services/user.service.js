const DbModel = require('../database/db.model');

class UserService {
    static async getUser(id) {
        try {
            const user = await DbModel.getUser(id);

            return {
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                twoFactorEnabled: user.two_factor_enabled,
                wins: user.wins,
                losses: user.losses
            };
        } catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }
    }
}

module.exports = UserService;