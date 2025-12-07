// Run home featured migration
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { dbHelpers } = require('../config/database');

async function runMigration() {
    console.log('🚀 Running home featured migration...');
    
    try {
        // Wait a bit for database to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if columns already exist
        const tableInfo = await dbHelpers.all("PRAGMA table_info(listings)");
        const columnNames = tableInfo.map(col => col.name);
        
        // Add is_home_featured column if not exists
        if (!columnNames.includes('is_home_featured')) {
            await dbHelpers.run('ALTER TABLE listings ADD COLUMN is_home_featured BOOLEAN DEFAULT 0');
            console.log('✅ Added is_home_featured column to listings');
        } else {
            console.log('ℹ️ is_home_featured column already exists');
        }
        
        // Add home_featured_at column if not exists
        if (!columnNames.includes('home_featured_at')) {
            await dbHelpers.run('ALTER TABLE listings ADD COLUMN home_featured_at DATETIME');
            console.log('✅ Added home_featured_at column to listings');
        } else {
            console.log('ℹ️ home_featured_at column already exists');
        }
        
        // Check featured_listings table
        const featuredTableInfo = await dbHelpers.all("PRAGMA table_info(featured_listings)");
        const featuredColumnNames = featuredTableInfo.map(col => col.name);
        
        // Add is_home_featured to featured_listings if not exists
        if (!featuredColumnNames.includes('is_home_featured')) {
            await dbHelpers.run('ALTER TABLE featured_listings ADD COLUMN is_home_featured BOOLEAN DEFAULT 0');
            console.log('✅ Added is_home_featured column to featured_listings');
        } else {
            console.log('ℹ️ is_home_featured column already exists in featured_listings');
        }
        
        // Add home_featured_order to featured_listings if not exists
        if (!featuredColumnNames.includes('home_featured_order')) {
            await dbHelpers.run('ALTER TABLE featured_listings ADD COLUMN home_featured_order INTEGER DEFAULT 0');
            console.log('✅ Added home_featured_order column to featured_listings');
        } else {
            console.log('ℹ️ home_featured_order column already exists in featured_listings');
        }
        
        // Create indexes
        try {
            await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_listings_home_featured ON listings(is_home_featured)');
            await dbHelpers.run('CREATE INDEX IF NOT EXISTS idx_listings_home_featured_at ON listings(home_featured_at)');
            console.log('✅ Created indexes');
        } catch (e) {
            console.log('ℹ️ Indexes may already exist');
        }
        
        console.log('✅ Home featured migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

runMigration();
