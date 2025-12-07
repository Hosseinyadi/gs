// اسکریپت به‌روزرسانی استان‌ها - اضافه کردن استان‌های جدید و کل ایران
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const provinces = [
  { name: 'کل ایران', name_en: 'All Iran' },
  { name: 'تهران', name_en: 'Tehran' },
  { name: 'خوزستان', name_en: 'Khuzestan' },
  { name: 'بوشهر', name_en: 'Bushehr' },
  { name: 'اصفهان', name_en: 'Isfahan' },
  { name: 'خراسان رضوی', name_en: 'Razavi Khorasan' },
  { name: 'فارس', name_en: 'Fars' },
  { name: 'آذربایجان شرقی', name_en: 'East Azerbaijan' },
  { name: 'مازندران', name_en: 'Mazandaran' },
  { name: 'کرمان', name_en: 'Kerman' },
  { name: 'البرز', name_en: 'Alborz' },
  { name: 'گیلان', name_en: 'Gilan' },
  { name: 'کهگیلویه و بویراحمد', name_en: 'Kohgiluyeh and Boyer-Ahmad' },
  { name: 'آذربایجان غربی', name_en: 'West Azerbaijan' },
  { name: 'هرمزگان', name_en: 'Hormozgan' },
  { name: 'مرکزی', name_en: 'Markazi' },
  { name: 'یزد', name_en: 'Yazd' },
  { name: 'کرمانشاه', name_en: 'Kermanshah' },
  { name: 'قزوین', name_en: 'Qazvin' },
  { name: 'سیستان و بلوچستان', name_en: 'Sistan and Baluchestan' },
  { name: 'همدان', name_en: 'Hamadan' },
  { name: 'ایلام', name_en: 'Ilam' },
  { name: 'گلستان', name_en: 'Golestan' },
  { name: 'لرستان', name_en: 'Lorestan' },
  { name: 'زنجان', name_en: 'Zanjan' },
  { name: 'اردبیل', name_en: 'Ardabil' },
  { name: 'قم', name_en: 'Qom' },
  { name: 'کردستان', name_en: 'Kurdistan' },
  { name: 'سمنان', name_en: 'Semnan' },
  { name: 'چهارمحال و بختیاری', name_en: 'Chaharmahal and Bakhtiari' },
  { name: 'خراسان شمالی', name_en: 'North Khorasan' },
  { name: 'خراسان جنوبی', name_en: 'South Khorasan' }
];

console.log('🔄 به‌روزرسانی استان‌ها...');

db.serialize(() => {
  const stmt = db.prepare('INSERT OR IGNORE INTO provinces (name, name_en) VALUES (?, ?)');
  
  provinces.forEach(p => {
    stmt.run(p.name, p.name_en);
  });
  
  stmt.finalize();
  
  db.all('SELECT * FROM provinces ORDER BY id', (err, rows) => {
    if (err) {
      console.error('❌ خطا:', err);
    } else {
      console.log(`✅ ${rows.length} استان در دیتابیس:`);
      rows.forEach(r => console.log(`  - ${r.name} (${r.name_en})`));
    }
    db.close();
  });
});
