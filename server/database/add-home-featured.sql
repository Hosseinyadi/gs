-- Add home featured system
-- آگهی‌های ویژه صفحه اصلی

-- Add is_home_featured column to listings
ALTER TABLE listings ADD COLUMN is_home_featured BOOLEAN DEFAULT 0;

-- Add home_featured_at column for sorting by newest
ALTER TABLE listings ADD COLUMN home_featured_at DATETIME;

-- Create index for home featured listings
CREATE INDEX IF NOT EXISTS idx_listings_home_featured ON listings(is_home_featured);
CREATE INDEX IF NOT EXISTS idx_listings_home_featured_at ON listings(home_featured_at);

-- Add home_featured_order to featured_listings for manual ordering
ALTER TABLE featured_listings ADD COLUMN is_home_featured BOOLEAN DEFAULT 0;
ALTER TABLE featured_listings ADD COLUMN home_featured_order INTEGER DEFAULT 0;
