const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking categories in database...\n');

db.all('SELECT * FROM categories ORDER BY id', [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  if (rows.length === 0) {
    console.log('⚠️  No categories found in database!');
    console.log('\n💡 Run this to add default categories:');
    console.log('   node run-main-schema.js\n');
  } else {
    console.log(`✅ Found ${rows.length} categories:\n`);
    rows.forEach(row => {
      console.log(`  ${row.id}. ${row.name} (${row.slug})`);
      console.log(`     Type: ${row.category_type || 'N/A'}`);
      console.log(`     Icon: ${row.icon || 'N/A'}\n`);
    });
  }

  db.close();
});
