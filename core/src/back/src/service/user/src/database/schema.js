const DbUser = require('./db.user');

function initializeDatabase() {
    // Initialize all database tables
    DbUser.createTable();
}

module.exports = initializeDatabase;