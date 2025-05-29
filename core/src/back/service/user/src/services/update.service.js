const PasswordService = require('../../security/password/password.service');
const UserModel = require('../database/user.model');

class UpdateService {
    static async updateUsername(currentUsername, newUsername) {
        const result = await UserModel.updateUsername(currentUsername, newUsername);
        if (!result.changes) {
            throw new Error('User not found or username unchanged');
        }

        return {
            id: result.lastInsertRowid,
            username: newUsername
        };
    }

    static async updatePassword(username, newPassword) {
        const hashedPassword = await PasswordService.hashPassword(newPassword);
        const result = await UserModel.updatePassword(username, hashedPassword);

        if (!result.changes) {
            throw new Error('User not found');
        }

        return {
            id: result.lastInsertRowid,
            username: username
        };
    }
}

module.exports = UpdateService;