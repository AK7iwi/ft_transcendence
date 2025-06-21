const DbChat = require('./db.chat');

function initializeDatabase() {
    // Initialize all database tables
    DbChat.createTable();
}

module.exports = initializeDatabase;