// مرتب‌سازی استان‌ها - کل ایران اول
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔄 مرتب‌سازی استان‌ها...');

// ترتیب صحیح استان‌ها
const correctOrder = [
  'کل ایران',
  'تهران',
  'خوزستان',
  'بوشهر',
  'اصفهان',
  'خراسان رضوی',
  'فارس',
  'آذربایجان شرقی',
  'مازندران',
  'کرمان',
  'البرز',
  'گیلان',
  'کهگیلویه و بویراحمد',
  'آذربایجان غربی',
  'هرمزگان',
  'مرکزی',
  'یزد',
  'کرمانشاه',
  'قزوین',
  'سیستان و بلوچستان',
  'همدان',
  'ایلام',
  'گلستان',
  'لرستان',
  'زنجان',
  'اردبیل',
  'قم',
  'کردستان',
  'سمنان',
  'چهارمحال و بختیاری',
  'خراسان شمالی',
  'خراسان جنوبی'
];

db.serialize(() => {
  // اضافه کردن ستون sort_order اگر وجود نداره
  db.run(`ALTER TABLE provinces ADD COLUMN sort_order INTEGER DEFAULT 999`, (err) => {
    // اگر ستون وجود داره، خطا میده که مهم نیست
  });
  
  // به‌روزرسانی ترتیب
  const stmt = db.prepare('UPDATE provinces SET sort_order = ? WHERE name = ?');
  correctOrder.forEach((name, index) => {
    stmt.run(index + 1, name);
  });
  stmt.finalize();
  
  // نمایش نتیجه
  db.all('SELECT id, name, sort_order FROM provinces ORDER BY sort_order, id', (err, rows) => {
    if (err) {
      console.error('❌ خطا:', err);
    } else {
      console.log(`\n✅ ${rows.length} استان مرتب شد:`);
      rows.forEach((r, i) => console.log(`  ${i+1}. ${r.name}`));
    }
    db.close();
  });
});
