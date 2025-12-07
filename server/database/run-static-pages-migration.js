const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const sqlPath = path.join(__dirname, 'add-static-pages.sql');

const db = new sqlite3.Database(dbPath);

console.log('🔄 Running static pages migration...');

const sql = fs.readFileSync(sqlPath, 'utf8');
const statements = sql.split(';').filter(s => s.trim());

db.serialize(() => {
  statements.forEach((statement, index) => {
    if (statement.trim()) {
      db.run(statement, (err) => {
        if (err) {
          console.error(`❌ Error in statement ${index + 1}:`, err.message);
        } else {
          console.log(`✅ Statement ${index + 1} executed`);
        }
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err.message);
  } else {
    console.log('✅ Static pages migration completed!');
  }
});
