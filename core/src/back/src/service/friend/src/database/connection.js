const Database = require('better-sqlite3');

const db = new Database(process.env.FRIEND_DB_PATH);

db.pragma('foreign_keys = ON');

module.exports = db;