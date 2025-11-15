-- Trust Badge System Migration
-- Date: 2024-11-15
-- Description: Add trust badge system for verified listings by super admin

-- Add trust badge column to listings table
ALTER TABLE listings ADD COLUMN is_trust_verified BOOLEAN DEFAULT 0;
ALTER TABLE listings ADD COLUMN trust_verified_at DATETIME NULL;
ALTER TABLE listings ADD COLUMN trust_verified_by INTEGER NULL;

-- Create trust badge log table for audit trail
CREATE TABLE IF NOT EXISTS trust_badge_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('granted', 'revoked')),
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- Create index for trust badge queries
CREATE INDEX IF NOT EXISTS idx_listings_trust_verified ON listings(is_trust_verified, trust_verified_at);
CREATE INDEX IF NOT EXISTS idx_trust_badge_log_listing ON trust_badge_log(listing_id);
CREATE INDEX IF NOT EXISTS idx_trust_badge_log_admin ON trust_badge_log(admin_id);

-- Add foreign key constraint for trust_verified_by
-- ALTER TABLE listings ADD CONSTRAINT fk_listings_trust_verified_by 
-- FOREIGN KEY (trust_verified_by) REFERENCES admins(id) ON DELETE SET NULL;

-- Update existing featured listings to have higher priority when trust verified
-- This will be handled in application logic