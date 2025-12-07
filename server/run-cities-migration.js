const fs = require('fs');
const path = require('path');
const { db } = require('./config/database');

async function runCitiesMigration() {
    try {
        console.log('🏙️ Running cities migration...');
        
        // خواندن فایل SQL
        const sqlPath = path.join(__dirname, 'database', 'add-cities.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // اجرای دستورات SQL
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await new Promise((resolve, reject) => {
                    db.run(statement, (err) => {
                        if (err) {
                            console.error('❌ Error executing statement:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        }
        
        // بررسی تعداد شهرها
        const count = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM cities', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        console.log(`✅ Cities migration completed successfully!`);
        console.log(`📊 Total cities: ${count}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Cities migration failed:', error);
        process.exit(1);
    }
}

runCitiesMigration();