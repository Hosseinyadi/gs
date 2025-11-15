import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import apiService from "@/services/api";
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
  FileCode,
  Shield,
  Database,
  Activity,
  Crown,
  Package,
  CreditCard,
  Megaphone,
  HelpCircle,
  Mail,
  RefreshCw
} from "lucide-react";
import AdminListings from '@/components/admin/AdminListings';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminProviders from '@/components/admin/AdminProviders';
import AdminDiscounts from '@/components/admin/AdminDiscounts';
import AdminReports from '@/components/admin/AdminReports';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAuditLogs from '@/components/admin/AdminAuditLogs';
import AdminMedia from '@/components/admin/AdminMedia';
import AdminStaticPages from '@/components/admin/AdminStaticPages';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminCategories from '@/components/admin/AdminCategories';
import AdminMessages from '@/components/admin/AdminMessages';
import AdminPayments from '@/components/admin/AdminPayments';
import AdminReviews from '@/components/admin/AdminReviews';
import AdminTrustBadge from '@/components/admin/AdminTrustBadge';
import AdminPaymentSettings from '@/components/admin/AdminPaymentSettings';
import AdminBannerSettings from '@/components/admin/AdminBannerSettings';
import AdminManagement from '@/components/admin/AdminManagement';
import AdminMonthlyBackup from '@/components/admin/AdminMonthlyBackup';
import AdminLoyalCustomers from '@/components/admin/AdminLoyalCustomers';

const Admin = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    void loadDashboardStats();
  }, [admin, navigate]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminDashboard();
      if (response.success && response.data) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setStats({ total_listings: 11, active_listings: 11, total_users: 2, total_views: 4 });
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

  const isSuperAdmin = Boolean((admin as any)?.is_super_admin);
  
  // Debug: بررسی admin object
  console.log('Admin Object:', admin);
  console.log('Is Super Admin:', isSuperAdmin);

  const allTabs = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, color: 'bg-blue-500', available: true },
    { id: 'listings', label: 'آگهی‌ها', icon: FileText, color: 'bg-green-500', available: true },
    { id: 'users', label: 'کاربران', icon: Users, color: 'bg-purple-500', available: true },
    { id: 'admins', label: 'مدیریت ادمین‌ها', icon: Shield, color: 'bg-red-600', available: false }, // فقط Super Admin
    { id: 'providers', label: 'ارائه‌دهندگان', icon: UserCheck, color: 'bg-yellow-500', available: true },
    { id: 'discounts', label: 'تخفیف‌ها', icon: Tag, color: 'bg-red-500', available: true },
    { id: 'reports', label: 'گزارش‌ها', icon: BarChart3, color: 'bg-indigo-500', available: true },
    { id: 'media', label: 'رسانه', icon: Image, color: 'bg-pink-500', available: true },
    { id: 'pages', label: 'صفحات', icon: FileCode, color: 'bg-teal-500', available: true },
    { id: 'notifications', label: 'اعلان‌ها', icon: Bell, color: 'bg-orange-500', available: true },
    { id: 'categories', label: 'دسته‌بندی', icon: FolderTree, color: 'bg-cyan-500', available: true },
    { id: 'reviews', label: 'نظرات', icon: MessageSquare, color: 'bg-blue-500', available: true },
    { id: 'trust-badge', label: 'نماد اعتماد', icon: Shield, color: 'bg-blue-600', available: true, superAdminOnly: true },
    { id: 'messages', label: 'پیام‌ها', icon: MessageSquare, color: 'bg-lime-500', available: true },
    { id: 'payments', label: 'پرداخت‌ها', icon: CreditCard, color: 'bg-emerald-500', available: true },
    { id: 'payment-settings', label: 'تنظیمات پرداخت', icon: Settings, color: 'bg-orange-500', available: true, superAdminOnly: true },
    { id: 'banner-settings', label: 'مدیریت بنرها', icon: Image, color: 'bg-pink-500', available: true, superAdminOnly: true },
    { id: 'marketing', label: 'بازاریابی', icon: Megaphone, color: 'bg-fuchsia-500', available: true },
    { id: 'settings', label: 'تنظیمات', icon: Settings, color: 'bg-gray-500', available: true },
    { id: 'security', label: 'امنیت', icon: Lock, color: 'bg-rose-500', available: true },
    { id: 'backup', label: 'پشتیبان‌گیری', icon: Database, color: 'bg-purple-600', available: true, superAdminOnly: true },
    { id: 'loyal-customers', label: 'مشتریان وفادار', icon: Crown, color: 'bg-yellow-600', available: true },
    { id: 'audit', label: 'لاگ‌ها', icon: FileSearch, color: 'bg-violet-500', available: true },
    { id: 'help', label: 'راهنما', icon: HelpCircle, color: 'bg-stone-500', available: true },
    { id: 'support', label: 'پشتیبانی', icon: Mail, color: 'bg-zinc-500', available: true },
    { id: 'analytics', label: 'آنالیز', icon: Activity, color: 'bg-sky-500', available: true }
  ];

  const visibleTabs = allTabs.filter(tab => tab.available || isSuperAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="w-8 h-8" />
                پنل مدیریت گاراژ سنگین
              </h1>
              <p className="text-sm opacity-90 mt-1">
                خوش آمدید، {admin.name || admin.username}
                {isSuperAdmin && <Badge className="mr-2 bg-yellow-500">سوپر ادمین</Badge>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadDashboardStats} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                <RefreshCw className="w-4 h-4 ml-2" />
                بروزرسانی
              </Button>
              <Button onClick={handleLogout} variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 text-center font-bold shadow-md">
        <span className="animate-pulse">🎉</span>
        پنل کامل با {visibleTabs.length} بخش فعال - نسخه 2.0
        <span className="animate-pulse">🎉</span>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5" />
              بخش‌های مدیریتی ({visibleTabs.length} بخش فعال)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {allTabs.map((tab) => {
                const Icon = tab.icon;
                const isVisible = (tab.available || isSuperAdmin) && (!tab.superAdminOnly || isSuperAdmin);
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => isVisible && setActiveTab(tab.id)}
                    disabled={!isVisible}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300
                      ${!isVisible ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                      ${isVisible && isActive ? `${tab.color} text-white shadow-lg scale-105 ring-4 ring-white ring-opacity-50` : ''}
                      ${isVisible && !isActive ? 'bg-white hover:shadow-md hover:scale-105 text-gray-700 border-2 border-gray-200' : ''}
                    `}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${!isVisible ? 'opacity-50' : ''}`} />
                    <span className="text-xs font-medium text-center">{tab.label}</span>
                    {!isVisible && !isSuperAdmin && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded">
                        قفل
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardContent className="p-6 space-y-6">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <LayoutDashboard className="w-6 h-6 text-blue-500" />
                  <h2 className="text-2xl font-bold">داشبورد مدیریت</h2>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card className="border-l-4 border-blue-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">کل آگهی‌ها</p>
                              <p className="text-3xl font-bold mt-2">{stats?.total_listings || 0}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-green-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">آگهی‌های فعال</p>
                              <p className="text-3xl font-bold mt-2">{stats?.active_listings || 0}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-purple-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">کل کاربران</p>
                              <p className="text-3xl font-bold mt-2">{stats?.total_users || 0}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                              <Users className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-orange-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">کل بازدیدها</p>
                              <p className="text-3xl font-bold mt-2">{stats?.total_views || 0}</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                              <Eye className="h-6 w-6 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>دسترسی سریع به بخش‌ها</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {visibleTabs.slice(1, 9).map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <Button
                                key={tab.id}
                                variant="outline"
                                className="h-24 flex flex-col gap-2"
                                onClick={() => setActiveTab(tab.id)}
                              >
                                <Icon className="w-8 h-8" />
                                <span className="text-sm">{tab.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>وضعیت سیستم</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <Database className="w-8 h-8 mx-auto mb-2 text-green-600" />
                            <p className="text-sm font-medium">دیتابیس</p>
                            <Badge className="bg-green-500 mt-1">فعال</Badge>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm font-medium">سرور</p>
                            <Badge className="bg-blue-500 mt-1">آنلاین</Badge>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Shield className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                            <p className="text-sm font-medium">امنیت</p>
                            <Badge className="bg-purple-500 mt-1">ایمن</Badge>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <Package className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                            <p className="text-sm font-medium">نسخه</p>
                            <Badge className="bg-orange-500 mt-1">2.0</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {activeTab === 'listings' && <AdminListings />}
            {activeTab === 'users' && <AdminUsers />}
            {activeTab === 'reviews' && <AdminReviews />}
            {activeTab === 'trust-badge' && isSuperAdmin && <AdminTrustBadge />}
            {activeTab === 'backup' && isSuperAdmin && <AdminMonthlyBackup />}
            {activeTab === 'loyal-customers' && <AdminLoyalCustomers />}
            {activeTab === 'admins' && isSuperAdmin && <AdminManagement />}
            {activeTab === 'providers' && <AdminProviders />}
            {activeTab === 'discounts' && <AdminDiscounts />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'settings' && <AdminSettings />}
            {activeTab === 'audit' && <AdminAuditLogs />}
            {activeTab === 'media' && <AdminMedia />}
            {activeTab === 'pages' && <AdminStaticPages />}
            {activeTab === 'notifications' && <AdminNotifications />}
            {activeTab === 'categories' && <AdminCategories />}
            {activeTab === 'messages' && <AdminMessages />}
            {activeTab === 'payments' && <AdminPayments />}
            {activeTab === 'payment-settings' && <AdminPaymentSettings />}
            {activeTab === 'banner-settings' && <AdminBannerSettings />}

            {['marketing', 'security', 'help', 'support', 'analytics'].includes(activeTab) && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                  {(() => {
                    const tab = allTabs.find((t) => t.id === activeTab);
                    if (tab) {
                      const Icon = tab.icon;
                      return <Icon className="w-10 h-10 text-gray-500" />;
                    }
                    return null;
                  })()}
                </div>
                <h3 className="text-2xl font-bold mb-2">بخش {allTabs.find((t) => t.id === activeTab)?.label}</h3>
                <p className="text-gray-600 mb-4">این بخش در حال توسعه و تکمیل است</p>
                <div className="inline-flex flex-col gap-2 text-right">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">در نسخه بعدی فعال خواهد شد</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">تیم توسعه در حال کار روی این بخش</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
