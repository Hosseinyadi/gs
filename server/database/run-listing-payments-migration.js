const { dbHelpers } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🔄 Running listing payments migration...');
    
    try {
        // Read SQL file
        const sqlPath = path.join(__dirname, 'add-listing-payments.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split by semicolons and run each statement
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await dbHelpers.run(statement);
                    console.log('✅ Executed:', statement.substring(0, 50) + '...');
                } catch (err) {
                    // Ignore "column already exists" errors
                    if (err.message.includes('duplicate column') || err.message.includes('already exists')) {
                        console.log('⚠️ Skipped (already exists):', statement.substring(0, 50) + '...');
                    } else {
                        console.error('❌ Error:', err.message);
                    }
                }
            }
        }
        
        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

runMigration();
