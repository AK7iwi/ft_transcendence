const Database = require("better-sqlite3");
const path = require("path");

// 📁 Crée ou ouvre le fichier SQLite
const db = new Database(path.join(__dirname, "database.db"));

// 🏗️ Création initiale de la table si elle n'existe pas
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    twoFactorSecret TEXT
  )
`).run();

// 🔧 Migration pour ajouter le champ 2FA si la table existait déjà
try {
  db.prepare("ALTER TABLE users ADD COLUMN twoFactorSecret TEXT").run();
  console.log("🔁 Migration : colonne 'twoFactorSecret' ajoutée.");
} catch (err) {
  if (err.message.includes("duplicate column")) {
    console.log("La colonne 'twoFactorSecret' existe déjà.");
  } else {
    console.error(" Erreur pendant la migration de la DB :", err.message);
  }
}

module.exports = db;
