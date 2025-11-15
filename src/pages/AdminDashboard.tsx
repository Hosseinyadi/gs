import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Tag, 
  BarChart3, 
  UserCheck, 
  FileSearch,
  LogOut,
  Eye,
  CheckCircle,
  Bell,
  Lock,
  Download,
  FolderTree,
  MessageSquare,
  Image,
  FileCode
} from "lucide-react";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";

// کامپوننت‌ها
import AdminListings from '@/components/admin/AdminListings';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminProviders from '@/components/admin/AdminProviders';
import AdminDiscounts from '@/components/admin/AdminDiscounts';
import AdminReports from '@/components/admin/AdminReports';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAuditLogs from '@/components/admin/AdminAuditLogs';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminBackupRestore from '@/components/admin/AdminBackupRestore';
import AdminSecurityCenter from '@/components/admin/AdminSecurityCenter';
import AdminStaticPages from '@/components/admin/AdminStaticPages';
import AdminMedia from '@/components/admin/AdminMedia';

const AdminDashboardSimple = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ 
    total_listings: 0, 
    active_listings: 0, 
    total_users: 0, 
    total_views: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
    } else {
      loadDashboardStats();
    }
  }, [admin, navigate]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getEnhancedDashboard();
      if (response.success && response.data) {
        setStats({
          total_listings: response.data.total_listings || 0,
          active_listings: response.data.active_listings || 0,
          total_users: response.data.total_users || 0,
          total_views: response.data.total_views || 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
    toast.success('با موفقیت خارج شدید');
  };

  if (!admin) {
    return null;
  }

  const tabs = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, color: 'bg-blue-500' },
    { id: 'listings', label: 'آگهی‌ها', icon: FileText, color: 'bg-green-500' },
    { id: 'users', label: 'کاربران', icon: Users, color: 'bg-purple-500' },
    { id: 'providers', label: 'ارائه‌دهندگان', icon: UserCheck, color: 'bg-yellow-500' },
    { id: 'discounts', label: 'تخفیف‌ها', icon: Tag, color: 'bg-red-500' },
    { id: 'reports', label: 'گزارش‌ها', icon: BarChart3, color: 'bg-indigo-500' },
    { id: 'media', label: 'رسانه', icon: Image, color: 'bg-pink-500' },
    { id: 'pages', label: 'صفحات', icon: FileCode, color: 'bg-teal-500' },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell, color: 'bg-orange-500' },
    { id: 'categories', label: 'دسته‌بندی', icon: FolderTree, color: 'bg-cyan-500' },
    { id: 'messages', label: 'پیام‌ها', icon: MessageSquare, color: 'bg-lime-500' },
    { id: 'settings', label: 'تنظیمات', icon: Settings, color: 'bg-gray-500' },
    { id: 'security', label: 'امنیت', icon: Lock, color: 'bg-rose-500' },
    { id: 'backup', label: 'پشتیبان', icon: Download, color: 'bg-amber-500' },
    { id: 'audit', label: 'لاگ‌ها', icon: FileSearch, color: 'bg-violet-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">پنل مدیریت گاراژ سنگین</h1>
              <p className="text-sm opacity-90 mt-1">
                خوش آمدید، {admin.name || admin.username}
                {admin.is_super_admin && <Badge className="mr-2 bg-yellow-500">سوپر ادمین</Badge>}
              </p>
            </div>
            <Button onClick={handleLogout} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/50">
              <LogOut className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-green-600 text-white py-2 text-center font-bold shadow-md">
        ✅ پنل مدیریت کامل: 15 تب فعال - تمام قابلیت‌ها آماده استفاده
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tab Navigation - Simple Buttons */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-bold mb-4 text-gray-700">منوی مدیریت:</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg transition-all
                    ${activeTab === tab.id 
                      ? `${tab.color} text-white shadow-lg scale-105` 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">داشبورد</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">کل آگهی‌ها</p>
                        <p className="text-3xl font-bold mt-2">{stats.total_listings}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">آگهی‌های فعال</p>
                        <p className="text-3xl font-bold mt-2">{stats.active_listings}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">کل کاربران</p>
                        <p className="text-3xl font-bold mt-2">{stats.total_users}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Users className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">کل بازدیدها</p>
                        <p className="text-3xl font-bold mt-2">{stats.total_views}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Eye className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tab List */}
              <Card>
                <CardHeader>
                  <CardTitle>قابلیت‌های پنل مدیریت</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {tabs.map((tab, index) => (
                      <div key={tab.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <span className="text-green-600 font-bold">{index + 1}.</span>
                        <span className="text-sm font-medium">{tab.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'listings' && <AdminListings />}
          {activeTab === 'users' && <AdminUsers />}
          {activeTab === 'providers' && <AdminProviders />}
          {activeTab === 'discounts' && <AdminDiscounts />}
          {activeTab === 'reports' && <AdminReports />}
          {activeTab === 'settings' && <AdminSettings />}
          {activeTab === 'audit' && <AdminAuditLogs />}
          {activeTab === 'messages' && <AdminMessages />}
          {activeTab === 'notifications' && <AdminNotifications />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'backup' && <AdminBackupRestore />}
          {activeTab === 'security' && <AdminSecurityCenter />}
          {activeTab === 'pages' && <AdminStaticPages />}
          {activeTab === 'media' && <AdminMedia />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSimple;
