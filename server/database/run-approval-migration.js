require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/bilflow.db';

async function runMigration() {
  console.log('🔄 Starting approval system migration...');
  
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error opening database:', err);
      process.exit(1);
    }
  });

  // Read migration SQL
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'add-approval-system.sql'),
    'utf8'
  );

  // Split by semicolon and filter empty statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
    .sort((a, b) => {
      // Execute ALTER TABLE statements first
      if (a.startsWith('ALTER TABLE') && !b.startsWith('ALTER TABLE')) return -1;
      if (!a.startsWith('ALTER TABLE') && b.startsWith('ALTER TABLE')) return 1;
      return 0;
    });

  console.log(`📝 Found ${statements.length} SQL statements to execute`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing...`);
    console.log(statement.substring(0, 100) + '...');
    
    await new Promise((resolve, reject) => {
      db.run(statement, (err) => {
        if (err) {
          // Ignore "duplicate column" errors (already migrated)
          if (err.message.includes('duplicate column')) {
            console.log('⚠️  Column already exists, skipping...');
            resolve();
          } else {
            console.error('❌ Error:', err.message);
            reject(err);
          }
        } else {
          console.log('✅ Success');
          resolve();
        }
      });
    });
  }

  // Verify migration
  console.log('\n🔍 Verifying migration...');
  
  await new Promise((resolve, reject) => {
    db.get("PRAGMA table_info(listings)", (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  await new Promise((resolve, reject) => {
    db.all("SELECT approval_status, COUNT(*) as count FROM listings GROUP BY approval_status", (err, rows) => {
      if (err) {
        console.error('❌ Verification failed:', err);
        reject(err);
      } else {
        console.log('\n📊 Listings by approval status:');
        rows.forEach(row => {
          console.log(`   ${row.approval_status}: ${row.count}`);
        });
        resolve();
      }
    });
  });

  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('\n✅ Migration completed successfully!');
      console.log('🎉 Approval system is now active');
    }
  });
}

runMigration().catch(err => {
  console.error('💥 Migration failed:', err);
  process.exit(1);
});
