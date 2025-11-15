const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const schedule = require('node-schedule');

const DB_PATH = path.join(__dirname, '../database/bilflow.db');
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 7; // Keep last 7 backups

/**
 * Create backup directory if not exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Backup directory created');
  }
}

/**
 * Create database backup
 */
async function createBackup() {
  try {
    ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.db`);

    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
      console.error('❌ Database file not found:', DB_PATH);
      return { success: false, error: 'Database not found' };
    }

    // Copy database file
    fs.copyFileSync(DB_PATH, backupFile);

    const stats = fs.statSync(backupFile);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created: ${path.basename(backupFile)} (${sizeInMB} MB)`);

    // Clean old backups
    await cleanOldBackups();

    return {
      success: true,
      file: backupFile,
      size: stats.size,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Backup error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean old backups (keep only last MAX_BACKUPS)
 */
async function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      
      for (const file of toDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted old backup: ${file.name}`);
      }

      console.log(`✅ Cleaned ${toDelete.length} old backups`);
    }
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error);
  }
}

/**
 * Restore database from backup
 */
async function restoreBackup(backupFile) {
  try {
    if (!fs.existsSync(backupFile)) {
      console.error('❌ Backup file not found:', backupFile);
      return { success: false, error: 'Backup file not found' };
    }

    // Create backup of current database before restore
    const currentBackup = path.join(BACKUP_DIR, `pre-restore-${Date.now()}.db`);
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, currentBackup);
      console.log('📦 Current database backed up before restore');
    }

    // Restore backup
    fs.copyFileSync(backupFile, DB_PATH);

    console.log(`✅ Database restored from: ${path.basename(backupFile)}`);

    return {
      success: true,
      restoredFrom: backupFile,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ Restore error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List all backups
 */
function listBackups() {
  try {
    ensureBackupDir();

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
      .map(f => {
        const filePath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stats.size,
          sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created.getTime() - a.created.getTime());

    return files;
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    return [];
  }
}

/**
 * Schedule automatic backups
 */
function scheduleBackups() {
  // Daily backup at 2 AM
  schedule.scheduleJob('0 2 * * *', async () => {
    console.log('⏰ Running scheduled backup...');
    await createBackup();
  });

  // Weekly backup on Sunday at 3 AM
  schedule.scheduleJob('0 3 * * 0', async () => {
    console.log('⏰ Running weekly backup...');
    const result = await createBackup();
    if (result.success) {
      // Mark as weekly backup
      const weeklyFile = result.file.replace('backup-', 'weekly-backup-');
      fs.copyFileSync(result.file, weeklyFile);
      console.log('📅 Weekly backup created');
    }
  });

  console.log('⏰ Backup schedule initialized:');
  console.log('   - Daily: 2:00 AM');
  console.log('   - Weekly: Sunday 3:00 AM');
}

/**
 * Get backup statistics
 */
function getBackupStats() {
  const backups = listBackups();
  
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
  const totalSizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

  return {
    count: backups.length,
    totalSize,
    totalSizeInMB,
    oldest: backups.length > 0 ? backups[backups.length - 1].created : null,
    newest: backups.length > 0 ? backups[0].created : null
  };
}

// Export functions
module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  cleanOldBackups,
  scheduleBackups,
  getBackupStats
};

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'create':
      createBackup().then(result => {
        console.log('Result:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;

    case 'list':
      const backups = listBackups();
      console.log('\n📦 Available backups:\n');
      backups.forEach((b, i) => {
        console.log(`${i + 1}. ${b.name}`);
        console.log(`   Size: ${b.sizeInMB} MB`);
        console.log(`   Created: ${b.created.toLocaleString('fa-IR')}\n`);
      });
      break;

    case 'stats':
      const stats = getBackupStats();
      console.log('\n📊 Backup Statistics:\n');
      console.log(`Total backups: ${stats.count}`);
      console.log(`Total size: ${stats.totalSizeInMB} MB`);
      if (stats.oldest) {
        console.log(`Oldest: ${stats.oldest.toLocaleString('fa-IR')}`);
      }
      if (stats.newest) {
        console.log(`Newest: ${stats.newest.toLocaleString('fa-IR')}`);
      }
      break;

    case 'restore':
      const backupFile = process.argv[3];
      if (!backupFile) {
        console.error('❌ Please provide backup file path');
        console.log('Usage: node backup.js restore <backup-file>');
        process.exit(1);
      }
      restoreBackup(backupFile).then(result => {
        console.log('Result:', result);
        process.exit(result.success ? 0 : 1);
      });
      break;

    case 'clean':
      cleanOldBackups().then(() => {
        console.log('✅ Cleanup completed');
        process.exit(0);
      });
      break;

    default:
      console.log('Usage:');
      console.log('  node backup.js create   - Create new backup');
      console.log('  node backup.js list     - List all backups');
      console.log('  node backup.js stats    - Show backup statistics');
      console.log('  node backup.js restore <file> - Restore from backup');
      console.log('  node backup.js clean    - Clean old backups');
      process.exit(1);
  }
}
