const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const sql = fs.readFileSync(path.join(__dirname, 'add-featured-order.sql'), 'utf8');

db.exec(sql, (err) => {
    if (err) {
        console.error('❌ Error:', err.message);
    } else {
        console.log('✅ Featured order migration completed successfully!');
    }
    db.close();
});
