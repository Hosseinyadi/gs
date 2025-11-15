-- Migration: Add approval system for listings
-- Date: 2024-11-14

-- Step 1: Add columns to listings table
ALTER TABLE listings ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE listings ADD COLUMN rejection_reason TEXT;
ALTER TABLE listings ADD COLUMN approved_by INTEGER;
ALTER TABLE listings ADD COLUMN approved_at DATETIME;

-- Step 2: Update existing listings to 'approved' status (backward compatibility)
UPDATE listings SET approval_status = 'approved', approved_at = created_at WHERE approval_status IS NULL OR approval_status = 'pending';

-- Step 3: Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Step 4: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_listings_approval_status ON listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_user_approval ON listings(user_id, approval_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
