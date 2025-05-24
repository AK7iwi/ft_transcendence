const db = require('./db.index');

class UserDB {
    static async updateUser(currentUsername, newUsername) {
        if (!newUsername || newUsername.length < 3 || newUsername.length > 20) {
            throw new Error('New username must be between 3 and 20 characters');
        }

        const stmt = db.prepare(`UPDATE users SET username = ? WHERE username = ?`);
        const result = stmt.run(newUsername, currentUsername);

        if (result.changes === 0) {
            throw new Error('User not found or username unchanged');
        }

        return { username: newUsername };
    }

    static async updatePassword(username, newPassword) {
        const stmt = db.prepare(`UPDATE users SET password = ? WHERE username = ?`);
        const result = stmt.run(newPassword, username);

        if (result.changes === 0) {
            throw new Error('User not found');
        }

        return { message: 'Password updated successfully' };
    }
}

module.exports = UserDB;