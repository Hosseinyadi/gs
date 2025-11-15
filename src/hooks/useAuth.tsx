import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
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
        
        if (adminToken) {
          // Check if admin is logged in
          apiService.setToken(adminToken);
          const adminData = localStorage.getItem('admin_data');
          if (adminData) {
            try {
              setAdmin(JSON.parse(adminData));
            } catch (e) {
              console.error('Failed to parse admin data:', e);
              localStorage.removeItem('admin_token');
              localStorage.removeItem('admin_data');
            }
          }
        } else if (token) {
          // Check if regular user is logged in
          apiService.setToken(token);
          
          // Try to get user profile
          const response = await apiService.getProfile();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear it
            apiService.logout();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiService.logout();
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
        setUser(response.data.user);
        setAdmin(null); // Clear admin if user logs in
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