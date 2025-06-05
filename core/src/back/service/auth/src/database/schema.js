const DbAuth = require('./db_models/db.auth');  

function initializeDatabase() {
    // Initialize all database tables
    DbAuth.createTable();
}

module.exports = initializeDatabase;