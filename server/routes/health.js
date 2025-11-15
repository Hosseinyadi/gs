const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const checkDiskSpace = require('check-disk-space').default;
const os = require('os');

/**
 * @route   GET /health
 * @desc    Health check endpoint with detailed system status
 * @access  Public
 */
router.get('/', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'unknown',
      disk: 'unknown',
      memory: 'unknown'
    },
    metrics: {}
  };

  try {
    // Check database connection
    await db.get('SELECT 1');
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'DEGRADED';
    console.error('Database health check failed:', error);
  }

  try {
    // Check disk space
    const diskPath = process.platform === 'win32' ? 'C:/' : '/';
    const diskInfo = await checkDiskSpace(diskPath);
    const freeGB = (diskInfo.free / (1024 ** 3)).toFixed(2);
    const totalGB = (diskInfo.size / (1024 ** 3)).toFixed(2);
    const usagePercent = ((1 - diskInfo.free / diskInfo.size) * 100).toFixed(1);
    
    health.metrics.disk = {
      free: `${freeGB} GB`,
      total: `${totalGB} GB`,
      usage: `${usagePercent}%`
    };
    
    health.checks.disk = diskInfo.free > 1000000000 ? 'healthy' : 'warning'; // 1GB threshold
  } catch (error) {
    health.checks.disk = 'unknown';
    console.error('Disk check failed:', error);
  }

  try {
    // Check memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    
    health.metrics.memory = {
      total: `${(totalMem / (1024 ** 3)).toFixed(2)} GB`,
      used: `${(usedMem / (1024 ** 3)).toFixed(2)} GB`,
      free: `${(freeMem / (1024 ** 3)).toFixed(2)} GB`,
      usage: `${memUsagePercent}%`
    };
    
    health.checks.memory = memUsagePercent < 90 ? 'healthy' : 'warning';
  } catch (error) {
    health.checks.memory = 'unknown';
    console.error('Memory check failed:', error);
  }

  // Overall status
  const allHealthy = Object.values(health.checks).every(check => check === 'healthy');
  const anyUnhealthy = Object.values(health.checks).some(check => check === 'unhealthy');
  
  if (anyUnhealthy) {
    health.status = 'UNHEALTHY';
  } else if (!allHealthy) {
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'OK' ? 200 : health.status === 'DEGRADED' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
