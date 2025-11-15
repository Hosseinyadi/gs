const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database', 'bilflow.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Add a test user
db.run(`
  INSERT OR IGNORE INTO users (id, phone, name, email, is_verified, created_at)
  VALUES (1, '09123456789', 'کاربر تست', 'test@example.com', 1, datetime('now'))
`, (err) => {
  if (err) {
    console.error('❌ Error adding test user:', err);
  } else {
    console.log('✅ Test user added successfully');
    console.log('   Phone: 09123456789');
    console.log('   Name: کاربر تست');
  }
  
  db.close();
});
