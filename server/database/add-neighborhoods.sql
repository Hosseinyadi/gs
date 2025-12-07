-- جدول محله‌ها
CREATE TABLE IF NOT EXISTS neighborhoods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_en TEXT,
    city_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- ایندکس برای جستجوی سریع‌تر
CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city_id);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_active ON neighborhoods(is_active);

-- محله‌های تهران (نمونه)
INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'ونک', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'سعادت‌آباد', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'شهرک غرب', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'تجریش', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'پونک', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'یوسف‌آباد', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'جردن', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'الهیه', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'نیاوران', id FROM cities WHERE name = 'تهران' LIMIT 1;

INSERT OR IGNORE INTO neighborhoods (name, city_id) 
SELECT 'زعفرانیه', id FROM cities WHERE name = 'تهران' LIMIT 1;
