// Run master admin migration
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { dbHelpers } = require('../config/database');

async function runMigration() {
    console.log('🚀 Running master admin migration...');
    
    try {
        // Wait for database to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if columns already exist
        const tableInfo = await dbHelpers.all("PRAGMA table_info(admin_users)");
        const columnNames = tableInfo.map(col => col.name);
        
        // Add is_master_admin column if not exists
        if (!columnNames.includes('is_master_admin')) {
            await dbHelpers.run('ALTER TABLE admin_users ADD COLUMN is_master_admin BOOLEAN DEFAULT 0');
            console.log('✅ Added is_master_admin column');
        } else {
            console.log('ℹ️ is_master_admin column already exists');
        }
        
        // Add created_by_master column if not exists
        if (!columnNames.includes('created_by_master')) {
            await dbHelpers.run('ALTER TABLE admin_users ADD COLUMN created_by_master INTEGER');
            console.log('✅ Added created_by_master column');
        } else {
            console.log('ℹ️ created_by_master column already exists');
        }
        
        // Create index
        try {
            await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_admin_users_master ON admin_users(is_master_admin)');
            console.log('✅ Created index');
        } catch (e) {
            console.log('ℹ️ Index may already exist');
        }
        
        // Check if there's already a master admin
        const existingMaster = await dbHelpers.get('SELECT id FROM admin_users WHERE is_master_admin = 1');
        
        if (!existingMaster) {
            // Make the first super admin the master admin
            const firstSuperAdmin = await dbHelpers.get('SELECT id FROM admin_users WHERE is_super_admin = 1 ORDER BY id ASC LIMIT 1');
            
            if (firstSuperAdmin) {
                await dbHelpers.run('UPDATE admin_users SET is_master_admin = 1 WHERE id = ?', [firstSuperAdmin.id]);
                console.log(`✅ Set admin ID ${firstSuperAdmin.id} as Master Admin`);
            } else {
                // Create a master admin if none exists
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('master123', 10);
                
                await dbHelpers.run(`
                    INSERT INTO admin_users (username, password_hash, role, is_super_admin, is_master_admin, name, permissions)
                    VALUES ('master', ?, 'master_admin', 1, 1, 'مستر ادمین', '["*"]')
                `, [hashedPassword]);
                console.log('✅ Created new Master Admin (username: master, password: master123)');
            }
        } else {
            console.log(`ℹ️ Master Admin already exists (ID: ${existingMaster.id})`);
        }
        
        console.log('✅ Master admin migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

runMigration();
