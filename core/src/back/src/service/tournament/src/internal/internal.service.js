const DbTournament = require('../database/db.tournament');

class InternalService {
    static async createUser(userId, username) {
        try {
            await DbTournament.createUser(userId, username);
        } catch (error) {
            throw error;
        }
    }

    static async updateUsername(currentUsername, newUsername) {
        try {
            await DbTournament.updateUsername(currentUsername, newUsername);
        } catch (error) {
            throw error;
        }
    }

    static async updateAvatar(userId, username, avatarPath) {
        try {
            await DbTournament.updateAvatar(userId, username, avatarPath);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = InternalService;