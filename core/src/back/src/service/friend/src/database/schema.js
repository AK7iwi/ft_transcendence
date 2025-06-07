const DbFriend = require('./db.friend');  

function initializeDatabase() {
    // Initialize all database tables
    DbFriend.createTable();
}

module.exports = initializeDatabase;