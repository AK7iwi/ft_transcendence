const db = require('./connection');

class DbFriend {
    static async createTable() {
        // Create users table
        const createUsersTable = db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL UNIQUE,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        createUsersTable.run();

        // Create friends table
        const createFriendsTable = db.prepare(`
            CREATE TABLE IF NOT EXISTS friends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                status TEXT DEFAULT 'accepted',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (friend_id) REFERENCES users(id)
            )
        `);
        createFriendsTable.run();

        // Create blocks table
        const createBlocksTable = db.prepare(`
            CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                blocker_id INTEGER NOT NULL,
                blocked_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        createBlocksTable.run();
    }

    static async findUserByUsername(username) {
        return db.prepare('SELECT user_id FROM users WHERE username = ?').get(username);
    }

    // Friendship operations
    static async findFriendship(userId, friendId) {
        return db.prepare(`
            SELECT 1 FROM friends
            WHERE user_id = ? AND friend_id = ?
        `).get(userId, friendId);
    }

    static async createFriendship(userId, friendId) {
        return db.prepare(`
            INSERT INTO friends (user_id, friend_id, status)
            VALUES (?, ?, 'accepted')
        `).run(userId, friendId);
    }

    static async deleteFriendship(userId, friendId) {
        return db.prepare(`
            DELETE FROM friends
            WHERE user_id = ? AND friend_id = ?
        `).run(userId, friendId);
    }

    static async getFriends(userId) {
        const stmt = db.prepare(`
            SELECT u.user_id, u.username,
                   CASE
                       WHEN u.avatar IS NOT NULL AND u.avatar != ''
                       THEN '/avatars/' || u.avatar
                       ELSE '/avatars/default.png'
                   END AS avatar
            FROM friends f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = ?
        `);
        return stmt.all(userId);
    }

    static async getBlockedIds(blockerId) {
        return db.prepare('SELECT blocked_id FROM blocks WHERE blocker_id = ?').all(blockerId);
    }

    //INTERNAL ROUTES
    static async createUser(userId, username) {
        const stmt = db.prepare(`
            INSERT INTO users (user_id, username) 
            VALUES (?, ?)
        `);
        return stmt.run(userId, username);
    }

    static async updateUsername(currentUsername, newUsername) {
        const stmt = db.prepare(`
            UPDATE users 
            SET username = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE username = ?
        `);
        return stmt.run(newUsername, currentUsername);
    }


}

module.exports = DbFriend;