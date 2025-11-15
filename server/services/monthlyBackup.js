const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { dbHelpers } = require('../config/database');
const { logAdminAction } = require('../middleware/auth');

/**
 * Monthly Backup Service for Super Admin
 * Secure, encrypted, and comprehensive backup system
 */

class MonthlyBackupService {
    constructor() {
        this.backupDir = path.join(__dirname, '..', 'backups', 'monthly');
        this.ensureBackupDirectory();
    }

    /**
     * Ensure backup directory exists
     */
    ensureBackupDirectory() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
            console.log('📁 Monthly backup directory created');
        }
    }

    /**
     * Create monthly backup (Super Admin only)
     * @param {number} adminId - Admin ID requesting backup
     * @param {boolean} isSuperAdmin - Is super admin
     * @param {string} password - Encryption password
     * @returns {Object} Backup result
     */
    async createMonthlyBackup(adminId, isSuperAdmin, password) {
        if (!isSuperAdmin) {
            throw new Error('فقط سوپر ادمین می‌تواند پشتیبان ماهانه ایجاد کند');
        }

        if (!password || password.length < 8) {
            throw new Error('رمز عبور باید حداقل 8 کاراکتر باشد');
        }

        console.log('🔄 Starting monthly backup creation...');
        
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupId = `monthly-${timestamp}`;
            const backupPath = path.join(this.backupDir, `${backupId}.json`);
            const encryptedPath = path.join(this.backupDir, `${backupId}.encrypted`);

            // Collect all data
            const backupData = await this.collectBackupData();
            
            // Add metadata
            backupData.metadata = {
                backup_id: backupId,
                created_at: new Date().toISOString(),
                created_by: adminId,
                backup_type: 'monthly_full',
                version: '1.0.0',
                total_records: this.countTotalRecords(backupData)
            };

            // Write unencrypted backup (temporary)
            fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            
            // Encrypt the backup
            const encryptionResult = await this.encryptBackup(backupPath, encryptedPath, password);
            
            // Delete unencrypted file
            fs.unlinkSync(backupPath);
            
            // Log the action
            await logAdminAction(adminId, 'create_monthly_backup', {
                backup_id: backupId,
                file_size: encryptionResult.fileSize,
                total_records: backupData.metadata.total_records,
                encrypted: true
            });

            console.log(`✅ Monthly backup created: ${backupId}`);
            
            return {
                success: true,
                backup_id: backupId,
                file_path: encryptedPath,
                file_size: encryptionResult.fileSize,
                total_records: backupData.metadata.total_records,
                created_at: backupData.metadata.created_at
            };

        } catch (error) {
            console.error('❌ Monthly backup creation failed:', error);
            throw error;
        }
    }

    /**
     * Collect all backup data
     * @returns {Object} Complete backup data
     */
    async collectBackupData() {
        console.log('📊 Collecting backup data...');
        
        const data = {};

        // Core tables
        data.listings = await dbHelpers.all('SELECT * FROM listings ORDER BY id');
        data.users = await dbHelpers.all('SELECT id, name, phone, email, created_at, updated_at FROM users ORDER BY id');
        data.categories = await dbHelpers.all('SELECT * FROM categories ORDER BY id');
        
        // Reviews and ratings
        data.reviews = await dbHelpers.all('SELECT * FROM reviews ORDER BY id');
        
        // Admin and management
        data.admins = await dbHelpers.all('SELECT id, username, name, email, role, is_super_admin, created_at FROM admins ORDER BY id');
        data.admin_activity_log = await dbHelpers.all('SELECT * FROM admin_activity_log ORDER BY created_at DESC LIMIT 1000');
        
        // Featured and payments
        data.featured_listings = await dbHelpers.all('SELECT * FROM featured_listings ORDER BY id');
        data.payments = await dbHelpers.all('SELECT * FROM payments ORDER BY created_at DESC');
        data.payment_history = await dbHelpers.all('SELECT * FROM payment_history ORDER BY created_at DESC');
        
        // Discounts and promotions
        data.discount_codes = await dbHelpers.all('SELECT * FROM discount_codes ORDER BY id');
        
        // Trust badges
        data.trust_badge_log = await dbHelpers.all('SELECT * FROM trust_badge_log ORDER BY created_at DESC');
        
        // Favorites
        data.favorites = await dbHelpers.all('SELECT * FROM favorites ORDER BY created_at DESC');
        
        // System settings (if exists)
        try {
            data.settings = await dbHelpers.all('SELECT * FROM settings ORDER BY key');
        } catch (e) {
            data.settings = [];
        }

        console.log('✅ Data collection completed');
        return data;
    }

    /**
     * Count total records in backup
     * @param {Object} backupData - Backup data
     * @returns {number} Total record count
     */
    countTotalRecords(backupData) {
        let total = 0;
        for (const [key, value] of Object.entries(backupData)) {
            if (key !== 'metadata' && Array.isArray(value)) {
                total += value.length;
            }
        }
        return total;
    }

    /**
     * Encrypt backup file
     * @param {string} inputPath - Input file path
     * @param {string} outputPath - Output file path
     * @param {string} password - Encryption password
     * @returns {Object} Encryption result
     */
    async encryptBackup(inputPath, outputPath, password) {
        console.log('🔐 Encrypting backup...');
        
        try {
            // Generate encryption key from password
            const salt = crypto.randomBytes(32);
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
            
            // Generate IV
            const iv = crypto.randomBytes(16);
            
            // Create cipher
            const cipher = crypto.createCipherGCM('aes-256-gcm', key);
            cipher.setAAD(Buffer.from('monthly-backup'));
            
            // Read input file
            const inputData = fs.readFileSync(inputPath);
            
            // Encrypt
            const encrypted = Buffer.concat([
                cipher.update(inputData),
                cipher.final()
            ]);
            
            // Get auth tag
            const authTag = cipher.getAuthTag();
            
            // Create final encrypted file with metadata
            const encryptedFile = Buffer.concat([
                Buffer.from('GARAGESANGIN_BACKUP_V1'), // Header (20 bytes)
                salt, // 32 bytes
                iv, // 16 bytes
                authTag, // 16 bytes
                encrypted // Variable length
            ]);
            
            // Write encrypted file
            fs.writeFileSync(outputPath, encryptedFile);
            
            const fileSize = fs.statSync(outputPath).size;
            
            console.log(`🔐 Backup encrypted successfully (${Math.round(fileSize / 1024)} KB)`);
            
            return {
                success: true,
                fileSize: fileSize,
                encrypted: true
            };
            
        } catch (error) {
            console.error('❌ Encryption failed:', error);
            throw new Error('خطا در رمزگذاری پشتیبان');
        }
    }

    /**
     * Decrypt backup file
     * @param {string} encryptedPath - Encrypted file path
     * @param {string} password - Decryption password
     * @returns {Object} Decrypted data
     */
    async decryptBackup(encryptedPath, password) {
        console.log('🔓 Decrypting backup...');
        
        try {
            // Read encrypted file
            const encryptedFile = fs.readFileSync(encryptedPath);
            
            // Verify header
            const header = encryptedFile.slice(0, 20).toString();
            if (header !== 'GARAGESANGIN_BACKUP_V1') {
                throw new Error('فایل پشتیبان نامعتبر است');
            }
            
            // Extract components
            const salt = encryptedFile.slice(20, 52);
            const iv = encryptedFile.slice(52, 68);
            const authTag = encryptedFile.slice(68, 84);
            const encrypted = encryptedFile.slice(84);
            
            // Generate key
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
            
            // Create decipher
            const decipher = crypto.createDecipherGCM('aes-256-gcm', key);
            decipher.setAAD(Buffer.from('monthly-backup'));
            decipher.setAuthTag(authTag);
            
            // Decrypt
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            // Parse JSON
            const backupData = JSON.parse(decrypted.toString());
            
            console.log('🔓 Backup decrypted successfully');
            return backupData;
            
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            throw new Error('خطا در رمزگشایی پشتیبان - رمز عبور اشتباه است');
        }
    }

    /**
     * List available monthly backups
     * @returns {Array} List of backups
     */
    async listMonthlyBackups() {
        try {
            const files = fs.readdirSync(this.backupDir);
            const backups = [];
            
            for (const file of files) {
                if (file.endsWith('.encrypted')) {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    
                    backups.push({
                        filename: file,
                        backup_id: file.replace('.encrypted', ''),
                        size: stats.size,
                        created_at: stats.birthtime.toISOString(),
                        size_mb: Math.round(stats.size / 1024 / 1024 * 100) / 100
                    });
                }
            }
            
            // Sort by creation date (newest first)
            backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return backups;
        } catch (error) {
            console.error('Error listing backups:', error);
            return [];
        }
    }

    /**
     * Delete old backups (keep last 12 months)
     * @param {number} adminId - Admin ID
     * @returns {Object} Cleanup result
     */
    async cleanupOldBackups(adminId) {
        try {
            const backups = await this.listMonthlyBackups();
            const keepCount = 12; // Keep last 12 months
            
            if (backups.length <= keepCount) {
                return {
                    success: true,
                    message: 'No old backups to delete',
                    deleted: 0
                };
            }
            
            const toDelete = backups.slice(keepCount);
            let deletedCount = 0;
            
            for (const backup of toDelete) {
                const filePath = path.join(this.backupDir, backup.filename);
                try {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`🗑️ Deleted old backup: ${backup.backup_id}`);
                } catch (error) {
                    console.error(`❌ Failed to delete backup ${backup.backup_id}:`, error);
                }
            }
            
            // Log cleanup action
            await logAdminAction(adminId, 'cleanup_monthly_backups', {
                deleted_count: deletedCount,
                kept_count: keepCount
            });
            
            return {
                success: true,
                message: `${deletedCount} old backups deleted`,
                deleted: deletedCount
            };
            
        } catch (error) {
            console.error('Backup cleanup error:', error);
            throw error;
        }
    }

    /**
     * Get backup statistics
     * @returns {Object} Backup statistics
     */
    async getBackupStats() {
        try {
            const backups = await this.listMonthlyBackups();
            
            const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
            const avgSize = backups.length > 0 ? totalSize / backups.length : 0;
            
            return {
                total_backups: backups.length,
                total_size_mb: Math.round(totalSize / 1024 / 1024 * 100) / 100,
                average_size_mb: Math.round(avgSize / 1024 / 1024 * 100) / 100,
                oldest_backup: backups.length > 0 ? backups[backups.length - 1].created_at : null,
                newest_backup: backups.length > 0 ? backups[0].created_at : null
            };
        } catch (error) {
            console.error('Error getting backup stats:', error);
            return null;
        }
    }
}

module.exports = new MonthlyBackupService();