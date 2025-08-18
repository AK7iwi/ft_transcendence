const db = require('./connection');

class DbChat {
    static async createTable() {
        const usersStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL UNIQUE,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        usersStmt.run();

        const messagesStmt = db.prepare(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender_id INTEGER NOT NULL,
                receiver_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(sender_id) REFERENCES users(id),
                FOREIGN KEY(receiver_id) REFERENCES users(id)
            )
        `);
        messagesStmt.run();
    }

    static async createMessage(senderId, receiverId, content) {
        const stmt = db.prepare(`
            INSERT INTO messages (sender_id, receiver_id, content)
            VALUES (?, ?, ?)
        `);
        return stmt.run(senderId, receiverId, content);
    }

    static async getMessages(senderId, receiverId) {
        const stmt = db.prepare(`
            SELECT
                m.id,
                m.timestamp,
                m.content,
                sender.username AS sender,
                receiver.username AS receiver
            FROM messages m
            JOIN users sender ON m.sender_id = sender.id
            JOIN users receiver ON m.receiver_id = receiver.id
            WHERE (m.sender_id = ? AND m.receiver_id = ?)
                OR (m.sender_id = ? AND m.receiver_id = ?)
            ORDER BY m.timestamp ASC
        `);
        return stmt.all(senderId, receiverId, receiverId, senderId);
    }

    static async getUserById(userId) {
        const stmt = db.prepare(`
            SELECT user_id, username
            FROM users
            WHERE user_id = ?
        `);
        return stmt.get(userId);
    }

    /////////////////////// INTERNAL ROUTES /////////////////////
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

module.exports = DbChat;
