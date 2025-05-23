const Database = require('better-sqlite3');

// No logging
const db = new Database(process.env.DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

module.exports = db;