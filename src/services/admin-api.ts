// Admin Panel API Service
import apiService from './api';

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
  updated_by?: number;
  created_at: string;
  updated_at: string;
}

export interface DiscountCode {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_usage?: number;
  per_user_limit: number;
  usage_count: number;
  valid_from?: string;
  valid_until?: string;
  scope: 'featured' | 'wallet' | 'all';
  min_amount: number;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceProvider {
  id: number;
  user_id: number;
  business_name: string;
  business_type: 'parts' | 'services';
  phone: string;
  email?: string;
  address?: string;
  description?: string;
  documents?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason?: string;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  admin_id: number;
  action: string;
  target_type?: string;
  target_id?: number;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  username?: string;
  admin_name?: string;
}

class AdminApiService {
  // ==================== Settings ====================
  async getSettings(category?: string) {
    const params = category ? `?category=${category}` : '';
    return apiService.request(`/admin/settings${params}`, { method: 'GET' });
  }

  async getSetting(key: string) {
    return apiService.request(`/admin/settings/${key}`, { method: 'GET' });
  }

  async updateSetting(key: string, value: string) {
    return apiService.request(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }

  async bulkUpdateSettings(settings: { key: string; value: string }[]) {
    return apiService.request('/admin/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ settings })
    });
  }

  async getSettingHistory(key: string) {
    return apiService.request(`/admin/settings/${key}/history`, { method: 'GET' });
  }

  // ==================== Discount Codes ====================
  async getDiscounts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiService.request(`/admin/discounts?${queryParams}`, { method: 'GET' });
  }

  async getDiscount(id: number) {
    return apiService.request(`/admin/discounts/${id}`, { method: 'GET' });
  }

  async createDiscount(data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    scope: 'featured' | 'wallet' | 'all';
    max_usage?: number;
    per_user_limit?: number;
    min_amount?: number;
    valid_from?: string;
    valid_until?: string;
  }) {
    return apiService.request('/admin/discounts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateDiscount(id: number, data: {
    is_active?: boolean;
    max_usage?: number;
    valid_until?: string;
  }) {
    return apiService.request(`/admin/discounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteDiscount(id: number) {
    return apiService.request(`/admin/discounts/${id}`, { method: 'DELETE' });
  }

  async validateDiscount(code: string, amount: number, scope: string) {
    return apiService.request('/admin/discounts/validate', {
      method: 'POST',
      body: JSON.stringify({ code, amount, scope })
    });
  }

  // ==================== Reports ====================
  async getFinancialReport(params?: {
    start_date?: string;
    end_date?: string;
    type?: 'daily' | 'weekly' | 'monthly';
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiService.request(`/admin/reports/financial?${queryParams}`, { method: 'GET' });
  }

  async getUsersReport(params?: {
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiService.request(`/admin/reports/users?${queryParams}`, { method: 'GET' });
  }

  async getListingsReport() {
    return apiService.request('/admin/reports/listings', { method: 'GET' });
  }

  async exportReport(type: string, params?: {
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    const url = `${apiService['baseURL']}/admin/reports/export/${type}?${queryParams}`;
    window.open(url, '_blank');
  }

  // ==================== Audit Logs ====================
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    admin_id?: number;
    action?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiService.request(`/admin/audit?${queryParams}`, { method: 'GET' });
  }

  async getAuditSummary(days?: number) {
    const params = days ? `?days=${days}` : '';
    return apiService.request(`/admin/audit/summary${params}`, { method: 'GET' });
  }

  // ==================== Service Providers ====================
  async getProviders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiService.request(`/admin/providers?${queryParams}`, { method: 'GET' });
  }

  async getProvider(id: number) {
    return apiService.request(`/admin/providers/${id}`, { method: 'GET' });
  }

  async createProvider(data: {
    phone: string;
    business_name: string;
    business_type: 'parts' | 'services';
    email?: string;
    address?: string;
    description?: string;
  }) {
    return apiService.request('/admin/providers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async approveProvider(id: number) {
    return apiService.request(`/admin/providers/${id}/approve`, {
      method: 'POST'
    });
  }

  async rejectProvider(id: number, reason: string) {
    return apiService.request(`/admin/providers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async suspendProvider(id: number, reason: string) {
    return apiService.request(`/admin/providers/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async getProviderStats() {
    return apiService.request('/admin/providers/stats/overview', { method: 'GET' });
  }

  // ==================== Enhanced Dashboard ====================
  async getEnhancedDashboard() {
    return apiService.request('/admin/dashboard', { method: 'GET' });
  }

  // ==================== Security Center ====================
  async getBlockedIPs() {
    return apiService.request('/admin/security/blocked-ips', { method: 'GET' });
  }

  async blockIP(ip: string, reason: string) {
    return apiService.request('/admin/security/blocked-ips', {
      method: 'POST',
      body: JSON.stringify({ ip, reason })
    });
  }

  async unblockIP(id: number) {
    return apiService.request(`/admin/security/blocked-ips/${id}`, {
      method: 'DELETE'
    });
  }

  async getLoginLogs(params?: { limit?: number }) {
    const queryParams = new URLSearchParams((params || {}) as any).toString();
    return apiService.request(`/admin/security/login-logs${queryParams ? `?${queryParams}` : ''}`, { method: 'GET' });
  }

  // ==================== User Management ====================
  async blockUser(userId: number, reason: string) {
    return apiService.request(`/admin/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  async unblockUser(userId: number) {
    return apiService.request(`/admin/users/${userId}/unblock`, {
      method: 'POST'
    });
  }

  async adjustUserWallet(userId: number, amount: number, note: string) {
    return apiService.request(`/admin/users/${userId}/wallet`, {
      method: 'POST',
      body: JSON.stringify({ amount, note })
    });
  }

  // ==================== Featured Listings ====================
  async makeListingFeatured(listingId: number, durationDays: number) {
    return apiService.request(`/admin/listings/${listingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_featured: true, duration_days: durationDays })
    });
  }

  // ==================== Static Pages ====================
  async getStaticPages() {
    return apiService.request('/admin/static-pages', { method: 'GET' });
  }

  async updateStaticPage(pageKey: string, data: { title: string; content: string }) {
    return apiService.request(`/admin/static-pages/${pageKey}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // ==================== Contact Messages ====================
  async getContactMessages(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiService.request(`/admin/messages?${queryParams}`, { method: 'GET' });
  }

  async markContactMessageAsRead(messageId: number) {
    return apiService.request(`/admin/messages/${messageId}/read`, {
      method: 'POST'
    });
  }

  async replyToContactMessage(messageId: number, replyText: string) {
    return apiService.request(`/admin/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply: replyText })
    });
  }

  // ==================== Broadcast Notifications ====================
  async getBroadcastNotifications(params?: {
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiService.request(`/admin/notifications?${queryParams}`, { method: 'GET' });
  }

  async sendBroadcastNotification(data: {
    title: string;
    message: string;
    type: string;
  }) {
    return apiService.request('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // ==================== Backup & Restore ====================
  async createBackup(type: 'database' | 'media'): Promise<{ success: boolean; blob: () => Promise<Blob> }>
  {
    const baseURL = (apiService as any)['baseURL'] as string;
    const token = localStorage.getItem('auth_token');
    const url = `${baseURL}/admin/backup?type=${encodeURIComponent(type)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      // Try to parse JSON error, otherwise use status text
      try {
        const data = await res.json();
        throw new Error(data?.message || 'خطا در ایجاد بک‌آپ');
      } catch (_) {
        throw new Error(res.statusText || 'خطا در ایجاد بک‌آپ');
      }
    }

    // Return a compatible object for the component usage
    return {
      success: true,
      blob: () => res.blob(),
    };
  }

  async restoreBackup(formData: FormData) {
    const baseURL = (apiService as any)['baseURL'] as string;
    const token = localStorage.getItem('auth_token');
    const url = `${baseURL}/admin/backup/restore`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Do NOT set Content-Type when sending FormData
      } as any,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error((data && (data.message || data.error)) || 'خطا در بازیابی بک‌آپ');
    }
    return data;
  }
}

export const adminApi = new AdminApiService();
export default adminApi;
