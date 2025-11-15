require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.DB_PATH || './database/bilflow.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
    process.exit(1);
  }
});

console.log('🔄 Adding approval_status column...');

db.run("ALTER TABLE listings ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending'", (err) => {
  if (err) {
    if (err.message.includes('duplicate column')) {
      console.log('✅ Column already exists');
    } else {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  } else {
    console.log('✅ approval_status column added successfully');
  }
  
  // Now run the full migration
  console.log('🔄 Running full migration...');
  require('./run-approval-migration.js');
});