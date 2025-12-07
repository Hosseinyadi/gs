-- جدول صفحات استاتیک
CREATE TABLE IF NOT EXISTS static_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- درج صفحات پیش‌فرض
INSERT OR IGNORE INTO static_pages (slug, title, content, meta_title, meta_description) VALUES
('about', 'درباره ما', '', 'درباره گاراژ سنگین', 'درباره پلتفرم گاراژ سنگین'),
('faq', 'سوالات متداول', '', 'سوالات متداول گاراژ سنگین', 'پاسخ سوالات رایج کاربران'),
('terms', 'قوانین و مقررات', '', 'قوانین گاراژ سنگین', 'قوانین و مقررات استفاده از سایت'),
('help', 'راهنمای سایت', '', 'راهنمای گاراژ سنگین', 'آموزش استفاده از سایت'),
('privacy', 'حریم خصوصی', '', 'حریم خصوصی گاراژ سنگین', 'سیاست حفظ حریم خصوصی'),
('contact', 'تماس با ما', '', 'تماس با گاراژ سنگین', 'راه‌های ارتباط با ما');
