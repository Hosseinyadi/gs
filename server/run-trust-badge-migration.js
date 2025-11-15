const { dbHelpers } = require('./config/database');

async function runTrustBadgeMigration() {
    console.log('🔄 Running trust badge system migration...');
    
    try {
        // Add trust badge columns to listings table
        console.log('1. Adding trust badge columns...');
        
        try {
            await dbHelpers.run('ALTER TABLE listings ADD COLUMN is_trust_verified BOOLEAN DEFAULT 0');
            console.log('✅ Added is_trust_verified column');
        } catch (e) {
            console.log('⚠️ is_trust_verified column already exists');
        }

        try {
            await dbHelpers.run('ALTER TABLE listings ADD COLUMN trust_verified_at DATETIME NULL');
            console.log('✅ Added trust_verified_at column');
        } catch (e) {
            console.log('⚠️ trust_verified_at column already exists');
        }

        try {
            await dbHelpers.run('ALTER TABLE listings ADD COLUMN trust_verified_by INTEGER NULL');
            console.log('✅ Added trust_verified_by column');
        } catch (e) {
            console.log('⚠️ trust_verified_by column already exists');
        }

        // Create trust badge log table
        console.log('2. Creating trust badge log table...');
        await dbHelpers.run(`
            CREATE TABLE IF NOT EXISTS trust_badge_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL,
                admin_id INTEGER NOT NULL,
                action TEXT NOT NULL CHECK (action IN ('granted', 'revoked')),
                reason TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
                FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
            )
        `);
        console.log('✅ Trust badge log table created');

        // Create indexes
        console.log('3. Creating indexes...');
        await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_listings_trust_verified ON listings(is_trust_verified, trust_verified_at)');
        await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_trust_badge_log_listing ON trust_badge_log(listing_id)');
        await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_trust_badge_log_admin ON trust_badge_log(admin_id)');
        console.log('✅ Indexes created');

        // Verify migration
        console.log('4. Verifying migration...');
        const trustCount = await dbHelpers.get('SELECT COUNT(*) as count FROM listings WHERE is_trust_verified = 1');
        const logCount = await dbHelpers.get('SELECT COUNT(*) as count FROM trust_badge_log');
        
        console.log(`📊 Trust verified listings: ${trustCount.count}`);
        console.log(`📊 Trust badge log entries: ${logCount.count}`);

        console.log('🎉 Trust badge system migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration
if (require.main === module) {
    runTrustBadgeMigration().catch(console.error);
}

module.exports = { runTrustBadgeMigration };