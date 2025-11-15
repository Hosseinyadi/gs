// Bil Flow API Service
// Replaces Supabase with custom API calls
// بهینه شده برای تمام مرورگرها (Chrome, Firefox, Safari, Edge, WebKit)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Polyfill برای AbortController در مرورگرهای قدیمی‌تر
if (typeof AbortController === 'undefined') {
  (window as any).AbortController = class AbortController {
    signal = { aborted: false };
    abort() {
      this.signal.aborted = true;
    }
  };
}

interface User {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
  is_admin?: boolean;
  created_at?: string;
}

interface Admin {
  id: number;
  username: string;
  name: string;
  is_super_admin: boolean;
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  type: 'rent' | 'sale';
  category_id: number;
  user_id: number;
  images?: string[];
  location: string;
  condition?: string;
  year?: number;
  brand?: string;
  model?: string;
  specifications?: Record<string, unknown>;
  is_active?: boolean;
  is_featured?: boolean;
  views_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number;
  description?: string;
  icon?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface DashboardStats {
  total_listings: number;
  active_listings: number;
  total_users: number;
  total_views: number;
}

interface ViewStat {
  date: string;
  views: number;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.baseURL = API_BASE_URL;
    // چک کردن هر دو توکن (ادمین و کاربر عادی)
    this.token = localStorage.getItem('admin_token') || localStorage.getItem('auth_token');
  }

  // تابع کمکی برای تلاش مجدد
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        console.log(`🔄 Retrying request... (${this.maxRetries - retries + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.retryRequest(fn, retries - 1);
      }
      throw error;
    }
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get headers for API requests
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method - بهینه شده برای تمام مرورگرها
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    useRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const makeRequest = async (): Promise<ApiResponse<T>> => {
      const url = `${this.baseURL}${endpoint}`;
      
      // بهینه‌سازی برای Edge و WebKit
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        // اضافه کردن تنظیمات برای سازگاری با تمام مرورگرها
        mode: 'cors', // فعال‌سازی CORS
        credentials: 'include', // ارسال کوکی‌ها
        cache: 'no-cache', // جلوگیری از مشکلات کش در Edge
        redirect: 'follow', // پیروی از redirect ها
      };

      try {
        console.log('🔵 API Request:', url, config);
        
        // استفاده از timeout برای جلوگیری از hang شدن در برخی مرورگرها
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('🟢 API Response Status:', response.status, response.statusText);
        
        // بررسی Content-Type برای اطمینان از JSON بودن پاسخ
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn('⚠️ Non-JSON response:', contentType);
          throw new Error('پاسخ سرور معتبر نیست');
        }
        
        // خواندن متن پاسخ و سپس parse کردن آن (سازگارتر با Edge)
        const text = await response.text();
        let data: ApiResponse<T>;
        
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError, 'Text:', text);
          throw new Error('خطا در پردازش پاسخ سرور');
        }
        
        console.log('📦 API Response Data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'خطا در درخواست');
        }

        return data;
      } catch (error) {
        if (error instanceof Error) {
          // بررسی نوع خطا
          if (error.name === 'AbortError') {
            console.error('❌ Request Timeout:', url);
            throw new Error('زمان درخواست به پایان رسید. لطفاً دوباره تلاش کنید');
          }
          
          console.error('❌ API Request Error:', {
            message: error.message,
            name: error.name,
            url: url,
            stack: error.stack
          });
        } else {
          console.error('❌ API Request Unknown Error:', error);
        }
        throw error;
      }
    };

    // استفاده از retry mechanism در صورت نیاز
    if (useRetry) {
      return this.retryRequest(makeRequest);
    }
    
    return makeRequest();
  }

  // Authentication methods
  async sendOTP(phone: string): Promise<ApiResponse> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }, true); // استفاده از retry
  }

  async verifyOTP(phone: string, otp: string, name?: string): Promise<ApiResponse<{
    user: User;
    token: string;
  }>> {
    const response = await this.request<{
      user: User;
      token: string;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name }),
    }, true); // استفاده از retry

    if (response.success && response.data) {
      const data = response.data as { user: User; token: string };
      if (data.token) {
        this.setToken(data.token);
      }
    }

    return response;
  }

  async adminLogin(username: string, password: string): Promise<ApiResponse<{
    admin: Admin;
    token: string;
  }>> {
    const response = await this.request<{
      admin: Admin;
      token: string;
    }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.data) {
      const data = response.data as { admin: Admin; token: string };
      if (data.token) {
        this.setToken(data.token);
      }
    }

    return response;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/profile');
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
    avatar?: string;
  }): Promise<ApiResponse<{ user: User }>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async loginWithPassword(
    phone: string,
    password: string,
    name?: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>('/auth/login-password', {
      method: 'POST',
      body: JSON.stringify({ phone, password, name }),
    });

    if (response.success && response.data) {
      const data = response.data as { user: User; token: string };
      if (data.token) {
        this.setToken(data.token);
      }
    }

    return response;
  }

  // Listings methods
  async getListings(params: {
    type?: 'rent' | 'sale';
    category?: number;
    page?: number;
    limit?: number;
    search?: string;
    min_price?: number;
    max_price?: number;
    location?: string;
  } = {}): Promise<ApiResponse<{
    listings: Listing[];
    pagination: Pagination;
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/listings?${searchParams.toString()}`);
  }

  async getListing(id: string | number): Promise<ApiResponse<{ listing: Listing }>> {
    return this.request(`/listings/${id}`);
  }

  async getListingById(id: string | number): Promise<ApiResponse<Listing>> {
    return this.request(`/listings/${id}`);
  }

  async getUserListings(): Promise<ApiResponse<{
    listings: Listing[];
    pagination?: Pagination;
  }>> {
    return this.request('/listings/my-listings');
  }

  async createListing(data: {
    title: string;
    description: string;
    price: number;
    type: 'rent' | 'sale';
    category_id: number;
    images?: string[];
    location: string;
    condition?: string;
    year?: number;
    brand?: string;
    model?: string;
    specifications?: Record<string, unknown>;
  }): Promise<ApiResponse<{ listing: Listing }>> {
    return this.request('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateListing(id: string | number, data: Partial<Listing>): Promise<ApiResponse<{ listing: Listing }>> {
    return this.request(`/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteListing(id: string | number): Promise<ApiResponse> {
    return this.request(`/listings/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories(): Promise<ApiResponse<{ categories: Category[] }>> {
    return this.request('/listings/categories/all');
  }

  // Favorites methods
  async getFavorites(): Promise<ApiResponse<{ favorites: Listing[] }>> {
    return this.request('/favorites');
  }

  async addToFavorites(listingId: number): Promise<ApiResponse> {
    return this.request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId }),
    });
  }

  async removeFromFavorites(listingId: number): Promise<ApiResponse> {
    return this.request(`/favorites/${listingId}`, {
      method: 'DELETE',
    });
  }

  async toggleFavorite(listingId: number): Promise<ApiResponse<{ is_favorite: boolean }>> {
    return this.request('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId }),
    });
  }

  // Payments (card-to-card)
  async getCardToCardInfo(): Promise<ApiResponse<{ card_number: string; cardholder_name: string; bank_name: string; price_per_day: number; payment_window_min: number }>> {
    return this.request('/payments/card-to-card/info');
  }

  async createFeatureCardToCard(listingId: number, durationDays: number): Promise<ApiResponse<{ transaction_id: number; amount: number; duration_days: number; deadline: string; card: { number: string; holder: string; bank: string } }>> {
    return this.request('/payments/feature/card-to-card', {
      method: 'POST',
      body: JSON.stringify({ listing_id: listingId, duration_days: durationDays }),
    });
  }

  async confirmFeatureCardToCard(transactionId: number, proofText: string): Promise<ApiResponse<{ inquiry_id: number }>> {
    return this.request('/payments/feature/card-to-card/confirm', {
      method: 'POST',
      body: JSON.stringify({ transaction_id: transactionId, proof_text: proofText }),
    });
  }

  // Admin methods
  async getAdminDashboard(): Promise<ApiResponse<{
    stats: DashboardStats;
    recent_listings: Listing[];
    top_categories: Category[];
    daily_stats: ViewStat[];
  }>> {
    return this.request('/admin/dashboard');
  }

  async getAdminListings(params: {
    page?: number;
    limit?: number;
    type?: 'rent' | 'sale';
    status?: 'active' | 'inactive';
    search?: string;
  } = {}): Promise<ApiResponse<{
    listings: Listing[];
    pagination: Pagination;
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/admin/listings?${searchParams.toString()}`);
  }

  async getAdminListing(id: string | number): Promise<ApiResponse<{
    listing: Listing;
    view_stats: ViewStat[];
  }>> {
    return this.request(`/admin/listings/${id}`);
  }

  async updateAdminListing(id: string | number, data: Partial<Listing>): Promise<ApiResponse<{ listing: Listing }>> {
    return this.request(`/admin/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateListingStatus(
    id: string | number,
    data: { is_active?: boolean; is_featured?: boolean }
  ): Promise<ApiResponse<{ listing: Listing }>> {
    return this.request(`/admin/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminListing(id: string | number): Promise<ApiResponse> {
    return this.request(`/admin/listings/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminUsers(params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{
    users: User[];
    pagination: Pagination;
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request(`/admin/users?${searchParams.toString()}`);
  }

  // Locations
  async getProvinces(): Promise<ApiResponse<{ provinces: { id: number; name: string }[] }>> {
    return this.request('/locations/provinces');
  }

  async getCities(provinceId: number): Promise<ApiResponse<{ cities: { id: number; name: string; province_id: number }[] }>> {
    return this.request(`/locations/cities/${provinceId}`);
  }

  // Admin Static Pages
  async getStaticPages(): Promise<ApiResponse<{ pages: any[] }>> {
    return this.request('/admin/static-pages');
  }

  async getStaticPage(slug: string): Promise<ApiResponse<{ page: any }>> {
    return this.request(`/admin/static-pages/${slug}`);
  }

  async updateStaticPage(slug: string, data: any): Promise<ApiResponse<{ page: any }>> {
    return this.request(`/admin/static-pages/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin Notifications
  async getAdminNotifications(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<{
    notifications: any[];
    pagination: Pagination;
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return this.request(`/admin/notifications?${searchParams.toString()}`);
  }

  async sendNotification(data: {
    user_id?: number;
    title: string;
    message: string;
    type?: string;
  }): Promise<ApiResponse> {
    return this.request('/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNotification(id: number): Promise<ApiResponse> {
    return this.request(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Messages
  async getAdminMessages(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<{
    messages: any[];
    pagination: Pagination;
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return this.request(`/admin/messages?${searchParams.toString()}`);
  }

  async updateMessageStatus(id: number, status: string): Promise<ApiResponse> {
    return this.request(`/admin/messages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteMessage(id: number): Promise<ApiResponse> {
    return this.request(`/admin/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Media
  async getAdminMedia(params: { page?: number; limit?: number } = {}): Promise<ApiResponse<{
    media: any[];
    pagination: Pagination;
  }>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return this.request(`/admin/media?${searchParams.toString()}`);
  }

  // Admin Categories
  async getAdminCategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.request('/admin/categories');
  }

  async createCategory(data: {
    name: string;
    slug?: string;
    icon?: string;
    category_type: string;
    description?: string;
  }): Promise<ApiResponse> {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: {
    name?: string;
    slug?: string;
    icon?: string;
    description?: string;
  }): Promise<ApiResponse> {
    return this.request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number): Promise<ApiResponse> {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Logout
  logout() {
    this.setToken(null);
  }
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
