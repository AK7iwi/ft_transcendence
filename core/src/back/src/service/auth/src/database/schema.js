const DbAuth = require('./db.auth');  

function initializeDatabase() {
    // Initialize all database tables
    DbAuth.createTable();
}

module.exports = initializeDatabase;