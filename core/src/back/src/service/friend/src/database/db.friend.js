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
            JOIN users u ON u.user_id = f.friend_id
            WHERE f.user_id = ?
        `);
        return stmt.all(userId);
    }

    static async getUserDetails(userId) {
        const stmt = db.prepare(`
            SELECT user_id, username,
                   CASE
                       WHEN avatar IS NOT NULL AND avatar != ''
                       THEN '/avatars/' || avatar
                       ELSE '/avatars/default.png'
                   END AS avatar
            FROM users
            WHERE user_id = ?
        `);
        return stmt.get(userId);
    }

    //INTERNAL ROUTES
    static async createUser(userId, username) {
        const stmt = db.prepare(`
            INSERT INTO users (user_id, username) 
            VALUES (?, ?)
        `);
        return stmt.run(userId, username);
    }
}

module.exports = DbFriend;