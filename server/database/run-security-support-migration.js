const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const sqlFile = path.join(__dirname, 'add-security-support-tables.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('🔄 Running security and support tables migration...');

const statements = sql.split(';').filter(s => s.trim());

db.serialize(() => {
  statements.forEach((statement, index) => {
    if (statement.trim()) {
      db.run(statement + ';', (err) => {
        if (err) {
          console.error(`❌ Error in statement ${index + 1}:`, err.message);
        } else {
          console.log(`✅ Statement ${index + 1} executed successfully`);
        }
      });
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('✅ Migration completed successfully!');
  }
});
