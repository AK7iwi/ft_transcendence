const DbUser = require('./db_models/db.user');

function initializeDatabase() {
    // Initialize all database tables
    DbUser.createTable();
}

module.exports = initializeDatabase;