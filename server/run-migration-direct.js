const { dbHelpers } = require('./config/database');

async function runMigration() {
    console.log('🔄 Running reviews migration...');
    
    try {
        // Create reviews table
        await dbHelpers.run(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                is_verified_purchase BOOLEAN DEFAULT 0,
                is_approved INTEGER DEFAULT 1,
                admin_response TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(listing_id, user_id)
            )
        `);
        console.log('✅ Reviews table created');

        // Add columns to listings table
        try {
            await dbHelpers.run('ALTER TABLE listings ADD COLUMN average_rating REAL DEFAULT 0');
            console.log('✅ Added average_rating column');
        } catch (e) {
            console.log('⚠️ average_rating column already exists');
        }

        try {
            await dbHelpers.run('ALTER TABLE listings ADD COLUMN total_reviews INTEGER DEFAULT 0');
            console.log('✅ Added total_reviews column');
        } catch (e) {
            console.log('⚠️ total_reviews column already exists');
        }

        // Create indexes
        await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id, is_approved)');
        await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)');
        await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)');
        await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_listings_rating ON listings(average_rating DESC)');
        console.log('✅ Indexes created');

        // Test the table
        const count = await dbHelpers.get('SELECT COUNT(*) as count FROM reviews');
        console.log(`📊 Reviews table ready with ${count.count} reviews`);

        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

runMigration();