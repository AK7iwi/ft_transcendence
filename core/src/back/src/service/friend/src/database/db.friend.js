const db = require('./connection');

class DbFriend {
    static async createTable() {
        const createUsersTable = db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL UNIQUE,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        createBlocksTable.run();
    }

    static async findFriendship(userId, friendId) {
        const stmt = db.prepare(`
            SELECT 1 
            FROM friends
            WHERE user_id = ? AND friend_id = ?
        `);

        return stmt.get(userId, friendId);
    }

    static async createFriendship(userId, friendId) {
        const stmt = db.prepare(`
            INSERT INTO friends (user_id, friend_id, status)
            VALUES (?, ?, 'accepted')
        `);

        return stmt.run(userId, friendId);
    }

    static async deleteFriendship(userId, friendId) {
        const stmt = db.prepare(`
            DELETE FROM friends
            WHERE user_id = ? AND friend_id = ?
        `);

        return stmt.run(userId, friendId);
    }

    static async blockUser(blockerId, blockedId) {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO blocks (blocker_id, blocked_id) 
            VALUES (?, ?)
        `);

        return stmt.run(blockerId, blockedId);
    }

    static async unblockUser(blockerId, blockedId) {
        const stmt = db.prepare(`
            DELETE FROM blocks 
            WHERE blocker_id = ? AND blocked_id = ?
        `);

        return stmt.run(blockerId, blockedId);
    }

    static async removeFriend(userId, friendId) {
        const stmt = db.prepare(`
            DELETE FROM friends 
            WHERE user_id = ? AND friend_id = ?
        `);

        return stmt.run(userId, friendId);
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

    static async getBlockedUsers(blockerId) {
        const stmt = db.prepare(`
            SELECT u.username 
            FROM blocks b
            JOIN users u ON u.id = b.blocked_id
            WHERE b.blocker_id = ?
        `);

        return stmt.all(blockerId);
    }

    static async getUserByUsername(username) {
        const stmt = db.prepare(`
            SELECT user_id, username 
            FROM users 
            WHERE username = ?
        `);

        return stmt.get(username);
    }

    static async getUserById(userId) {
        const stmt = db.prepare(`
            SELECT username 
            FROM users 
            WHERE user_id = ?
        `);

        return stmt.get(userId);
    }

    ///////////////////// INTERNAL ROUTES /////////////////////
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

    static async updateAvatar(userId, avatarPath) {
        const stmt = db.prepare(`
            UPDATE users 
            SET avatar = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?
        `);

        return stmt.run(avatarPath, userId);
    }
}

module.exports = DbFriend;