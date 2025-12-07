// Create Master Admin
// ایجاد سوپر ادمین اصلی (Master Admin)

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

async function createMasterAdmin() {
    const username = 'masteradmin';
    const password = 'Master@123456'; // رمز عبور قوی
    const name = 'Master Administrator';

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if master admin exists
        db.get('SELECT * FROM admins WHERE admin_level = ?', ['master'], (err, row) => {
            if (err) {
                console.error('❌ Error checking master admin:', err);
                return;
            }

            if (row) {
                console.log('⚠️  Master Admin already exists!');
                console.log('Username:', row.username);
                db.close();
                return;
            }

            // Create master admin
            db.run(`
                INSERT INTO admins (username, password, name, is_super_admin, admin_level, is_active, permissions)
                VALUES (?, ?, ?, 1, 'master', 1, ?)
            `, [username, hashedPassword, name, JSON.stringify({
                manage_admins: true,
                manage_listings: true,
                manage_users: true,
                manage_payments: true,
                manage_settings: true,
                view_analytics: true,
                manage_categories: true,
                manage_featured: true,
                delete_admins: true,
                modify_permissions: true
            })], function(err) {
                if (err) {
                    console.error('❌ Error creating master admin:', err);
                    db.close();
                    return;
                }

                console.log('✅ Master Admin created successfully!');
                console.log('');
                console.log('═══════════════════════════════════════');
                console.log('🔐 MASTER ADMIN CREDENTIALS');
                console.log('═══════════════════════════════════════');
                console.log('Username:', username);
                console.log('Password:', password);
                console.log('Level: Master Administrator');
                console.log('Permissions: FULL ACCESS');
                console.log('═══════════════════════════════════════');
                console.log('');
                console.log('⚠️  IMPORTANT: Change the password after first login!');
                console.log('⚠️  Keep these credentials safe and secure!');
                console.log('');

                db.close();
            });
        });
    } catch (error) {
        console.error('❌ Error:', error);
        db.close();
    }
}

// Run migration first
const fs = require('fs');
const migrationSQL = fs.readFileSync(path.join(__dirname, 'add-admin-hierarchy.sql'), 'utf8');

db.exec(migrationSQL, (err) => {
    if (err) {
        console.error('❌ Error running migration:', err);
        db.close();
        return;
    }

    console.log('✅ Migration completed successfully');
    createMasterAdmin();
});
