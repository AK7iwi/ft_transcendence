const DbFriend = require('./db_models/db.friend');  

function initializeDatabase() {
    // Initialize all database tables
    DbFriend.createTable();
}

module.exports = initializeDatabase;