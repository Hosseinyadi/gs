-- Additional Listing Payments Table
-- برای پرداخت آگهی‌های اضافی (بیش از سهمیه رایگان ماهانه)

CREATE TABLE IF NOT EXISTS additional_listing_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    listing_data TEXT NOT NULL, -- JSON data of the listing
    listing_id INTEGER, -- Will be set after listing is created
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled, expired
    payment_method VARCHAR(20), -- card_transfer, gateway
    receipt_image TEXT,
    proof_text TEXT,
    verified_by INTEGER,
    verified_at DATETIME,
    rejection_reason TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (verified_by) REFERENCES admin_users(id)
);

-- Add approval_status column to listings if not exists
-- This column tracks: pending, approved, rejected
ALTER TABLE listings ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_additional_payments_user ON additional_listing_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_additional_payments_status ON additional_listing_payments(status);
CREATE INDEX IF NOT EXISTS idx_listings_approval ON listings(approval_status);
