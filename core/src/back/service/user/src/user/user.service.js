const DbGetter = require('../database/db_models/db.getter');

class UserService {
    static async getUser(id) {
        try {
            const user = await DbGetter.getUser(id);

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
}

module.exports = UserService;