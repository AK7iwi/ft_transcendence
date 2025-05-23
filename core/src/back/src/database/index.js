const Database = require('better-sqlite3');

// No logging
const db = new Database('/data/database.sqlite');

// Enable foreign keys
db.pragma('foreign_keys = ON');

module.exports = db; 