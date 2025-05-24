const db = require('../database/db.index');
const DbService = require('../database/db.service');

class UpdateService {
    
    static async updateUser(currentUsername, newUsername) {
        const stmt = db.prepare(`
            UPDATE users 
            SET username = ? 
            WHERE username = ?
        `);
        
        const result = stmt.run(newUsername, currentUsername);
        if (result.changes === 0) {
            throw new Error('User not found or username unchanged');
        }

        return {
            id: result.lastInsertRowid,
            username: newUsername
        };
    }

    static async updatePassword(username, newPassword) {
        const hashedPassword = await DbService.hashPassword(newPassword);
        
        const stmt = db.prepare(`
            UPDATE users 
            SET password = ? 
            WHERE username = ?
        `);
        const result = stmt.run(hashedPassword, username);

        if (result.changes === 0) {
            throw new Error('User not found');
        }

        return {
            id: result.lastInsertRowid,
            username: username
        };
    }
}

module.exports = UpdateService;