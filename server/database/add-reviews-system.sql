-- Migration: Add reviews and ratings system
-- Date: 2024-11-14

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT 0,
    is_approved BOOLEAN DEFAULT 1,
    admin_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(listing_id, user_id) -- یک کاربر فقط یک نظر برای هر آگهی
);

-- Add rating fields to listings table
ALTER TABLE listings ADD COLUMN average_rating REAL DEFAULT 0;
ALTER TABLE listings ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_listings_rating ON listings(average_rating DESC);

-- Create trigger to update listing ratings automatically
CREATE TRIGGER IF NOT EXISTS update_listing_rating
AFTER INSERT ON reviews
WHEN NEW.is_approved = 1
BEGIN
    UPDATE listings 
    SET 
        average_rating = (
            SELECT AVG(CAST(rating AS REAL)) 
            FROM reviews 
            WHERE listing_id = NEW.listing_id AND is_approved = 1
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE listing_id = NEW.listing_id AND is_approved = 1
        )
    WHERE id = NEW.listing_id;
END;

-- Trigger for review updates
CREATE TRIGGER IF NOT EXISTS update_listing_rating_on_update
AFTER UPDATE ON reviews
WHEN NEW.is_approved != OLD.is_approved OR NEW.rating != OLD.rating
BEGIN
    UPDATE listings 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(CAST(rating AS REAL)), 0)
            FROM reviews 
            WHERE listing_id = NEW.listing_id AND is_approved = 1
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE listing_id = NEW.listing_id AND is_approved = 1
        )
    WHERE id = NEW.listing_id;
END;

-- Trigger for review deletion
CREATE TRIGGER IF NOT EXISTS update_listing_rating_on_delete
AFTER DELETE ON reviews
WHEN OLD.is_approved = 1
BEGIN
    UPDATE listings 
    SET 
        average_rating = (
            SELECT COALESCE(AVG(CAST(rating AS REAL)), 0)
            FROM reviews 
            WHERE listing_id = OLD.listing_id AND is_approved = 1
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE listing_id = OLD.listing_id AND is_approved = 1
        )
    WHERE id = OLD.listing_id;
END;