-- Add display_order to featured_listings
-- اضافه کردن ترتیب نمایش به آگهی‌های ویژه

-- اضافه کردن فیلد display_order
ALTER TABLE featured_listings ADD COLUMN display_order INTEGER DEFAULT 0;

-- Index برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_featured_display_order ON featured_listings(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_active ON featured_listings(end_date);

-- به‌روزرسانی ترتیب فعلی بر اساس تاریخ ایجاد
UPDATE featured_listings 
SET display_order = (
    SELECT COUNT(*) 
    FROM featured_listings f2 
    WHERE f2.created_at <= featured_listings.created_at
)
WHERE display_order = 0;
