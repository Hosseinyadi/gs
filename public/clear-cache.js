// Auto Clear Cache Script
// این اسکریپت به صورت خودکار کش مرورگر را پاک می‌کند

(function() {
  'use strict';
  
  const APP_VERSION = '2.4.0'; // نسخه اپلیکیشن - Advanced Filters + Financial Report + Export
  const VERSION_KEY = 'app_version';
  
  // چک کردن نسخه
  const currentVersion = localStorage.getItem(VERSION_KEY);
  
  if (currentVersion !== APP_VERSION) {
    console.log('🔄 New version detected, clearing cache...');
    
    // پاک کردن localStorage (به جز توکن‌های مهم)
    const authToken = localStorage.getItem('auth_token');
    const adminToken = localStorage.getItem('admin_token');
    
    localStorage.clear();
    
    // بازگرداندن توکن‌ها
    if (authToken) localStorage.setItem('auth_token', authToken);
    if (adminToken) localStorage.setItem('admin_token', adminToken);
    
    // ذخیره نسخه جدید
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    
    // پاک کردن sessionStorage
    sessionStorage.clear();
    
    // پاک کردن Service Worker Cache
    if ('caches' in window) {
      caches.keys().then(function(names) {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
    
    // Unregister Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
    
    console.log('✅ Cache cleared successfully!');
    
    // Reload page بدون cache
    window.location.reload(true);
  }
})();
