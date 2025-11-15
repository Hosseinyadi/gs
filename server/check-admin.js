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

// Check admin users
db.all('SELECT * FROM admin_users', [], (err, rows) => {
  if (err) {
    console.error('❌ Error querying admin_users:', err);
  } else {
    console.log('\n📊 Admin Users:');
    if (rows.length === 0) {
      console.log('   ⚠️  No admin users found!');
    } else {
      rows.forEach(admin => {
        console.log(`   - ID: ${admin.id}, Username: ${admin.username}, Role: ${admin.role}, Active: ${admin.is_active}`);
      });
    }
  }
  
  // Check regular users
  db.all('SELECT * FROM users LIMIT 5', [], (err, rows) => {
    if (err) {
      console.error('❌ Error querying users:', err);
    } else {
      console.log('\n👥 Regular Users (first 5):');
      if (rows.length === 0) {
        console.log('   ⚠️  No users found!');
      } else {
        rows.forEach(user => {
          console.log(`   - ID: ${user.id}, Phone: ${user.phone}, Name: ${user.name || 'N/A'}`);
        });
      }
    }
    
    // Check listings count
    db.get('SELECT COUNT(*) as count FROM listings', [], (err, row) => {
      if (err) {
        console.error('❌ Error counting listings:', err);
      } else {
        console.log(`\n📝 Total Listings: ${row.count}`);
      }
      
      db.close();
    });
  });
});
