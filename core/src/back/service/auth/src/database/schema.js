const UserModel = require('./user.model');  

function initializeDatabase() {
    // Initialize all database tables
    UserModel.createTable();
}

module.exports = initializeDatabase;