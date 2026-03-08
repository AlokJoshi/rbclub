const sqlite = require('better-sqlite3');
// 1. Initialize the SQLite database
// connects to the existing SQLite database
// const db = new sqlite('mydb.sqlite', { verbose: console.log });
const db = new sqlite('mydb.sqlite',);

// Optional: Enable WAL mode for better performance
// db.pragma('journal_mode = WAL');

module.exports = {
  db
};