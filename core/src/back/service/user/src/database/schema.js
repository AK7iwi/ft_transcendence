const DbModel = require('./db.model');

function initializeDatabase() {
    // Initialize all database tables
    DbModel.createTable();
}

module.exports = initializeDatabase;