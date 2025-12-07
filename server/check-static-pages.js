const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM static_pages', [], (err, rows) => {
  if (err) {
    console.log('Error:', err.message);
  } else {
    console.log('Static Pages in DB:');
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});
