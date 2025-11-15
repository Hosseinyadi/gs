const { db } = require('../config/database');

console.log('Starting admin system migration...');

try {
  // Add new columns to admin_users table
  console.log('Adding permissions column...');
  try {
    db.exec('ALTER TABLE admin_users ADD COLUMN permissions TEXT');
    console.log('✓ Added permissions column');
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log('✓ permissions column already exists');
    } else {
      throw e;
    }
  }

  console.log('Adding created_by column...');
  try {
    db.exec('ALTER TABLE admin_users ADD COLUMN created_by INTEGER REFERENCES admin_users(id)');
    console.log('✓ Added created_by column');
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log('✓ created_by column already exists');
    } else {
      throw e;
    }
  }

  console.log('Adding updated_at column...');
  try {
    db.exec('ALTER TABLE admin_users ADD COLUMN updated_at DATETIME');
    console.log('✓ Added updated_at column');
  } catch (e) {
    if (e.message.includes('duplicate column name')) {
      console.log('✓ updated_at column already exists');
    } else {
      throw e;
    }
  }

  // Create admin_activity_log table
  console.log('Creating admin_activity_log table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action VARCHAR(100) NOT NULL,
      resource VARCHAR(100),
      resource_id INTEGER,
      old_data TEXT,
      new_data TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES admin_users(id)
    )
  `);
  console.log('✓ Created admin_activity_log table');

  // Update existing admin users with default permissions
  console.log('Updating existing admin users with permissions...');
  const stmt = db.prepare('UPDATE admin_users SET permissions = ? WHERE permissions IS NULL OR permissions = ""');
  
  // Super admins get all permissions
  stmt.run('["*"]');
  console.log('✓ Updated admin permissions');

  console.log('\n✅ Migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Restart the server');
  console.log('2. Login to admin panel');
  console.log('3. Go to /admin/management to manage admins');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
