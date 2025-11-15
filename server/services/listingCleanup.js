const { dbHelpers } = require('../config/database');
const { logAdminAction } = require('../middleware/auth');

/**
 * Listing Cleanup Service
 * Automatically removes old listings every 40 days to keep the site fresh
 */

const CLEANUP_DAYS = 40; // Remove listings older than 40 days

/**
 * Clean up old listings
 * @param {boolean} dryRun - If true, only count without deleting
 * @returns {Object} Cleanup results
 */
async function cleanupOldListings(dryRun = false) {
    console.log(`🧹 Starting listing cleanup (${dryRun ? 'DRY RUN' : 'LIVE'})...`);
    
    try {
        // Calculate cutoff date (40 days ago)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
        const cutoffDateString = cutoffDate.toISOString();
        
        console.log(`📅 Cutoff date: ${cutoffDate.toLocaleDateString('fa-IR')}`);
        
        // Find old listings
        const oldListings = await dbHelpers.all(`
            SELECT 
                id, 
                title, 
                created_at,
                is_featured,
                approval_status,
                view_count
            FROM listings 
            WHERE created_at < ? 
            AND approval_status != 'rejected'
            ORDER BY created_at ASC
        `, [cutoffDateString]);
        
        console.log(`📊 Found ${oldListings.length} listings older than ${CLEANUP_DAYS} days`);
        
        if (oldListings.length === 0) {
            return {
                success: true,
                message: 'No old listings found',
                deleted: 0,
                preserved: 0,
                details: []
            };
        }
        
        let deletedCount = 0;
        let preservedCount = 0;
        const details = [];
        
        for (const listing of oldListings) {
            const shouldPreserve = await shouldPreserveListing(listing);
            
            if (shouldPreserve.preserve) {
                preservedCount++;
                details.push({
                    id: listing.id,
                    title: listing.title,
                    action: 'preserved',
                    reason: shouldPreserve.reason,
                    created_at: listing.created_at
                });
                
                console.log(`💎 Preserved: ${listing.title} (${shouldPreserve.reason})`);
            } else {
                if (!dryRun) {
                    // Delete the listing and related data
                    await deleteListing(listing.id);
                }
                
                deletedCount++;
                details.push({
                    id: listing.id,
                    title: listing.title,
                    action: 'deleted',
                    reason: 'Old listing cleanup',
                    created_at: listing.created_at
                });
                
                console.log(`🗑️ ${dryRun ? 'Would delete' : 'Deleted'}: ${listing.title}`);
            }
        }
        
        // Log the cleanup action
        if (!dryRun && (deletedCount > 0 || preservedCount > 0)) {
            await logCleanupAction(deletedCount, preservedCount, details);
        }
        
        const result = {
            success: true,
            message: `Cleanup completed: ${deletedCount} deleted, ${preservedCount} preserved`,
            deleted: deletedCount,
            preserved: preservedCount,
            cutoffDate: cutoffDateString,
            details: details
        };
        
        console.log(`✅ Cleanup completed: ${deletedCount} deleted, ${preservedCount} preserved`);
        return result;
        
    } catch (error) {
        console.error('❌ Cleanup error:', error);
        return {
            success: false,
            message: error.message,
            deleted: 0,
            preserved: 0,
            details: []
        };
    }
}

/**
 * Determine if a listing should be preserved
 * @param {Object} listing - Listing object
 * @returns {Object} Preservation decision
 */
async function shouldPreserveListing(listing) {
    // Preserve featured listings
    if (listing.is_featured) {
        return {
            preserve: true,
            reason: 'Featured listing'
        };
    }
    
    // Preserve high-traffic listings (more than 100 views)
    if (listing.view_count > 100) {
        return {
            preserve: true,
            reason: 'High traffic (100+ views)'
        };
    }
    
    // Check if listing has recent activity (reviews, messages, etc.)
    const recentActivity = await checkRecentActivity(listing.id);
    if (recentActivity) {
        return {
            preserve: true,
            reason: 'Recent user activity'
        };
    }
    
    // Check if listing is from a premium user
    const isPremiumUser = await checkPremiumUser(listing.id);
    if (isPremiumUser) {
        return {
            preserve: true,
            reason: 'Premium user listing'
        };
    }
    
    return {
        preserve: false,
        reason: 'Regular cleanup'
    };
}

/**
 * Check for recent activity on a listing
 * @param {number} listingId - Listing ID
 * @returns {boolean} Has recent activity
 */
async function checkRecentActivity(listingId) {
    try {
        // Check for recent reviews (last 7 days)
        const recentReviews = await dbHelpers.get(`
            SELECT COUNT(*) as count 
            FROM reviews 
            WHERE listing_id = ? 
            AND created_at > datetime('now', '-7 days')
        `, [listingId]);
        
        if (recentReviews.count > 0) {
            return true;
        }
        
        // Check for recent favorites (last 14 days)
        const recentFavorites = await dbHelpers.get(`
            SELECT COUNT(*) as count 
            FROM favorites 
            WHERE listing_id = ? 
            AND created_at > datetime('now', '-14 days')
        `, [listingId]);
        
        if (recentFavorites.count > 0) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking recent activity:', error);
        return false;
    }
}

/**
 * Check if listing owner is a premium user
 * @param {number} listingId - Listing ID
 * @returns {boolean} Is premium user
 */
async function checkPremiumUser(listingId) {
    try {
        // Check if user has made recent payments
        const premiumUser = await dbHelpers.get(`
            SELECT COUNT(*) as count
            FROM listings l
            JOIN payments p ON l.user_id = p.user_id
            WHERE l.id = ?
            AND p.status = 'completed'
            AND p.created_at > datetime('now', '-30 days')
        `, [listingId]);
        
        return premiumUser.count > 0;
    } catch (error) {
        console.error('Error checking premium user:', error);
        return false;
    }
}

/**
 * Delete a listing and all related data
 * @param {number} listingId - Listing ID
 */
async function deleteListing(listingId) {
    try {
        // Delete in correct order to maintain referential integrity
        
        // Delete reviews
        await dbHelpers.run('DELETE FROM reviews WHERE listing_id = ?', [listingId]);
        
        // Delete favorites
        await dbHelpers.run('DELETE FROM favorites WHERE listing_id = ?', [listingId]);
        
        // Delete featured listing records
        await dbHelpers.run('DELETE FROM featured_listings WHERE listing_id = ?', [listingId]);
        
        // Delete payment records related to this listing
        await dbHelpers.run('DELETE FROM payments WHERE listing_id = ?', [listingId]);
        
        // Finally delete the listing itself
        await dbHelpers.run('DELETE FROM listings WHERE id = ?', [listingId]);
        
        console.log(`🗑️ Deleted listing ${listingId} and all related data`);
    } catch (error) {
        console.error(`❌ Error deleting listing ${listingId}:`, error);
        throw error;
    }
}

/**
 * Log cleanup action for audit trail
 * @param {number} deletedCount - Number of deleted listings
 * @param {number} preservedCount - Number of preserved listings
 * @param {Array} details - Cleanup details
 */
async function logCleanupAction(deletedCount, preservedCount, details) {
    try {
        // Log to admin activity log (system action)
        await dbHelpers.run(`
            INSERT INTO admin_activity_log (
                admin_id, 
                action, 
                details, 
                ip_address, 
                created_at
            ) VALUES (?, ?, ?, ?, ?)
        `, [
            1, // System admin ID
            'automatic_cleanup',
            JSON.stringify({
                deleted: deletedCount,
                preserved: preservedCount,
                cutoff_days: CLEANUP_DAYS,
                details: details.slice(0, 10) // Limit details to prevent huge logs
            }),
            'system',
            new Date().toISOString()
        ]);
        
        console.log('📝 Cleanup action logged');
    } catch (error) {
        console.error('❌ Error logging cleanup action:', error);
    }
}

/**
 * Get cleanup statistics
 * @returns {Object} Cleanup stats
 */
async function getCleanupStats() {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS);
        
        const stats = await dbHelpers.get(`
            SELECT 
                COUNT(*) as total_old,
                COUNT(CASE WHEN is_featured = 1 THEN 1 END) as featured_old,
                COUNT(CASE WHEN view_count > 100 THEN 1 END) as high_traffic_old,
                AVG(view_count) as avg_views
            FROM listings 
            WHERE created_at < ?
            AND approval_status != 'rejected'
        `, [cutoffDate.toISOString()]);
        
        const lastCleanup = await dbHelpers.get(`
            SELECT created_at, details
            FROM admin_activity_log 
            WHERE action = 'automatic_cleanup'
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        
        return {
            ...stats,
            cutoff_date: cutoffDate.toISOString(),
            last_cleanup: lastCleanup?.created_at || null,
            last_cleanup_details: lastCleanup ? JSON.parse(lastCleanup.details) : null
        };
    } catch (error) {
        console.error('Error getting cleanup stats:', error);
        return null;
    }
}

module.exports = {
    cleanupOldListings,
    getCleanupStats,
    CLEANUP_DAYS
};