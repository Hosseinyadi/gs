-- اضافه کردن جدول شهرها
CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    province TEXT,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- اضافه کردن 10 شهر پرجمعیت ایران
INSERT OR IGNORE INTO cities (name, province, sort_order) VALUES
('تهران', 'تهران', 1),
('مشهد', 'خراسان رضوی', 2),
('اصفهان', 'اصفهان', 3),
('کرج', 'البرز', 4),
('شیراز', 'فارس', 5),
('تبریز', 'آذربایجان شرقی', 6),
('اهواز', 'خوزستان', 7),
('قم', 'قم', 8),
('رشت', 'گیلان', 9),
('کرمان', 'کرمان', 10);

-- اضافه کردن شهرهای بیشتر
INSERT OR IGNORE INTO cities (name, province, sort_order) VALUES
('یزد', 'یزد', 11),
('ارومیه', 'آذربایجان غربی', 12),
('همدان', 'همدان', 13),
('کرمانشاه', 'کرمانشاه', 14),
('اردبیل', 'اردبیل', 15),
('بندرعباس', 'هرمزگان', 16),
('زنجان', 'زنجان', 17),
('سنندج', 'کردستان', 18),
('قزوین', 'قزوین', 19),
('ساری', 'مازندران', 20),
('بابل', 'مازندران', 21),
('گرگان', 'گلستان', 22),
('بیرجند', 'خراسان جنوبی', 23),
('بوشهر', 'بوشهر', 24),
('یاسوج', 'کهگیلویه و بویراحمد', 25);