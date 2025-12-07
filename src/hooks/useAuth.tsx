import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import apiService from '../services/api';

interface User {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  created_at?: string;
}

interface Admin {
  id: number;
  username: string;
  name: string;
  is_super_admin: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (phone: string, otp: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithPassword: (phone: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => Promise<{ success: boolean; message?: string }>;
  sendOTP: (phone: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = !!admin;

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const adminToken = localStorage.getItem('admin_token');
        const userData = localStorage.getItem('user_data');
        
        console.log('[Auth Check] Starting...', { hasToken: !!token, hasAdminToken: !!adminToken, hasUserData: !!userData });
        
        if (adminToken) {
          // Check if admin is logged in
          apiService.setToken(adminToken);
          const adminData = localStorage.getItem('admin_data');
          if (adminData) {
            try {
              const parsedAdmin = JSON.parse(adminData);
              setAdmin(parsedAdmin);
              console.log('[Auth Check] Admin restored from localStorage:', parsedAdmin.username);
            } catch (e) {
              console.error('Failed to parse admin data:', e);
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_data');
            }
          }
        } else if (token) {
          // Check if regular user is logged in
          apiService.setToken(token);
          
          // اول از localStorage بخون برای سرعت بیشتر
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              console.log('[Auth Check] User data from localStorage:', parsedUser);
              if (parsedUser && parsedUser.id) {
                setUser(parsedUser);
                console.log('[Auth Check] User restored from localStorage:', parsedUser.phone);
              } else {
                console.warn('[Auth Check] Invalid user data in localStorage');
                localStorage.removeItem('user_data');
              }
            } catch (e) {
              console.error('Failed to parse user data:', e);
              localStorage.removeItem('user_data');
            }
          }
          
          // سپس از سرور تایید بگیر (در پس‌زمینه)
          try {
            const response = await apiService.getProfile();
            if (response.success && response.data?.user) {
              setUser(response.data.user);
              // به‌روزرسانی localStorage با داده‌های جدید
              localStorage.setItem('user_data', JSON.stringify(response.data.user));
              console.log('[Auth Check] User verified from server:', response.data.user.phone);
            } else if (!userData) {
              // فقط اگر userData هم نداشتیم، logout کن
              console.log('[Auth Check] No user data and server failed, logging out');
              apiService.logout();
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_data');
            }
          } catch (error) {
            // اگر سرور در دسترس نیست ولی userData داریم، ادامه بده
            console.warn('[Auth Check] Server check failed, using cached data:', error);
            if (!userData) {
              apiService.logout();
              localStorage.removeItem('auth_token');
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // فقط در صورت خطای جدی logout کن
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const sendOTP = async (phone: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.sendOTP(phone);
      return {
        success: response.success,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'خطا در ارسال کد تایید'
      };
    }
  };

  const login = async (phone: string, otp: string, name?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.verifyOTP(phone, otp, name);
      
      if (response.success && response.data) {
        const { user, token } = response.data as any;

        // ذخیره توکن کاربر و اطلاعات او برای پایداری لاگین
        if (token) {
          localStorage.setItem('auth_token', token);
          apiService.setToken(token);
        }
        if (user) {
          localStorage.setItem('user_data', JSON.stringify(user));
          setUser(user);
        } else {
          setUser(response.data.user);
        }

        // اگر کاربر معمولی لاگین کرد، ادمین را خالی کن
        setAdmin(null);

        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || 'خطا در ورود'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'خطا در ورود'
      };
    }
  };

  const loginWithPassword = async (phone: string, password: string, name?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.loginWithPassword(phone, password, name);
      
      if (response.success && response.data) {
        const { user: userData, token } = response.data as any;
        console.log('[useAuth] loginWithPassword success:', { userId: userData?.id, hasToken: !!token });

        // ذخیره توکن و اطلاعات کاربر
        if (token) {
          localStorage.setItem('auth_token', token);
          apiService.setToken(token);
        }
        if (userData) {
          localStorage.setItem('user_data', JSON.stringify(userData));
          setUser(userData);
        }

        // اگر کاربر معمولی لاگین کرد، ادمین را خالی کن
        setAdmin(null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_data');

        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || 'خطا در ورود'
        };
      }
    } catch (error) {
      console.error('[useAuth] loginWithPassword error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'خطا در ورود'
      };
    }
  };

  const adminLogin = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.adminLogin(username, password);
      
      if (response.success && response.data) {
        setAdmin(response.data.admin);
        setUser(null); // Clear user if admin logs in
        
        // Save admin data to localStorage
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_data', JSON.stringify(response.data.admin));
        localStorage.removeItem('auth_token'); // Clear user token
        
        // ⚠️ مهم: ست کردن توکن در apiService
        apiService.setToken(response.data.token);
        
        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || 'خطا در ورود ادمین'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'خطا در ورود ادمین'
      };
    }
  };

  const updateProfile = async (data: { name?: string; email?: string; avatar?: string }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiService.updateProfile(data);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return {
          success: true,
          message: response.message
        };
      } else {
        return {
          success: false,
          message: response.message || 'خطا در به‌روزرسانی پروفایل'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'خطا در به‌روزرسانی پروفایل'
      };
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    setAdmin(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_data');
  };

  const value: AuthContextType = {
    user,
    admin,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    loginWithPassword,
    adminLogin,
    logout,
    updateProfile,
    sendOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};