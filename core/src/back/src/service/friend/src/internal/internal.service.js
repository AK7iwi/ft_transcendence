const DbFriend = require('../database/db.friend');

class InternalService {
    static async createUser(userId, username) {
        try {
            await DbFriend.createUser(userId, username);
        } catch (error) {
            throw error;
        }
    }

    static async updateUsername(currentUsername, newUsername) {
        try {
            await DbFriend.updateUsername(currentUsername, newUsername);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = InternalService;