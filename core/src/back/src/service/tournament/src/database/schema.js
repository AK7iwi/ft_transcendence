const DbTournament = require('./db.tournament');  

function initializeDatabase() {
    // Initialize all database tables
    DbTournament.createTable();
}

module.exports = initializeDatabase;