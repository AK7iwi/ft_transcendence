const PasswordService = require('../../security/password/password.service');
const UserModel = require('../database/db.model');

class UpdateService {
    static async updateUsername(currentUsername, newUsername) {
        try {
            const result = await UserModel.updateUsername(currentUsername, newUsername);
            if (!result.changes) {
                throw new Error('User not found or username unchanged');
            }

            // Notify auth service to update username
            await app.axios.put(`${process.env.AUTH_SERVICE_URL}/internal/username`, {
                currentUsername,
                newUsername
            });

            return {
                id: result.lastInsertRowid,
                username: newUsername
            };
        } catch (error) {
            throw new Error(`Failed to update username: ${error.message}`);
        }
    }

    static async updatePassword(username, newPassword) {
        try {
            const hashedPassword = await PasswordService.hashPassword(newPassword);
            const result = await UserModel.updatePassword(username, hashedPassword);

            if (!result.changes) {
                throw new Error('User not found');
            }

            // Notify auth service to update password
            await app.axios.put(`${process.env.AUTH_SERVICE_URL}/internal/password`, {
                username,
                hashedPassword
            });

            return {
                id: result.lastInsertRowid,
                username: username
            };
        } catch (error) {
            throw new Error(`Failed to update password: ${error.message}`);
        }
    }
}

module.exports = UpdateService;