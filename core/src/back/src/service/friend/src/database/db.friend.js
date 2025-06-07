const db = require('./connection');

class DbFriend {
    static async createTable() {
        // Create the users table
        const userStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        userStmt.run();

        // Create the friends table
        const friendStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS friends (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                status TEXT DEFAULT 'accepted',
                UNIQUE(user_id, friend_id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (friend_id) REFERENCES users(id)
            )
        `);
        friendStmt.run();
    }

    // User operations
    static findUserByUsername(username) {
        return db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
    }

    static createUser(username) {
        return db.prepare('INSERT INTO users (username) VALUES (?)').run(username);
    }

    // Friendship operations
    static findFriendship(userId, friendId) {
        return db.prepare(`
            SELECT 1 FROM friends
            WHERE user_id = ? AND friend_id = ?
        `).get(userId, friendId);
    }

    static createFriendship(userId, friendId) {
        return db.prepare(`
            INSERT INTO friends (user_id, friend_id, status)
            VALUES (?, ?, 'accepted')
        `).run(userId, friendId);
    }

    static deleteFriendship(userId, friendId) {
        return db.prepare(`
            DELETE FROM friends
            WHERE user_id = ? AND friend_id = ?
        `).run(userId, friendId);
    }

    static getFriends(userId, limit, offset) {
        return db.prepare(`
            SELECT 
                u.id as friend_id,
                u.username,
                f.status,
                f.created_at
            FROM friends f
            JOIN users u ON f.friend_id = u.id
            WHERE f.user_id = ?
            LIMIT ? OFFSET ?
        `).all(userId, limit, offset);
    }

    // Get user's friend count
    static getFriendCount(userId) {
        return db.prepare(`
            SELECT COUNT(*) as count
            FROM friends
            WHERE user_id = ?
        `).get(userId);
    }

    // Get mutual friends
    static getMutualFriends(userId, friendId) {
        return db.prepare(`
            SELECT u.id, u.username
            FROM friends f1
            JOIN friends f2 ON f1.friend_id = f2.friend_id
            JOIN users u ON f1.friend_id = u.id
            WHERE f1.user_id = ? AND f2.user_id = ?
        `).all(userId, friendId);
    }

    //INTERNAL ROUTES
}

module.exports = DbFriend;