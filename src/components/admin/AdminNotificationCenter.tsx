import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Trash2,
  Check,
  X,
  RefreshCw,
  Filter,
  User,
  MessageSquare,
  Star,
  Settings
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminNotification {
  id: number;
  type: 'new_listing' | 'new_payment' | 'report' | 'new_user' | 'review' | 'renewal' | 'system';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

const AdminNotificationCenter = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      
      const response = await fetch(`${baseUrl}/admin/notification-center?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unread_count);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Auto refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadNotifications]);

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      
      await fetch(`${baseUrl}/admin/notification-center/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      
      await fetch(`${baseUrl}/admin/notification-center/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('همه اعلان‌ها خوانده شد');
    } catch (error) {
      toast.error('خطا در بروزرسانی');
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
      
      await fetch(`${baseUrl}/admin/notification-center/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('اعلان حذف شد');
    } catch (error) {
      toast.error('خطا در حذف');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_listing': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'new_payment': return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'report': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'new_user': return <User className="w-5 h-5 text-purple-500" />;
      case 'review': return <MessageSquare className="w-5 h-5 text-yellow-500" />;
      case 'renewal': return <RefreshCw className="w-5 h-5 text-orange-500" />;
      case 'system': return <Settings className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new_listing': return 'آگهی جدید';
      case 'new_payment': return 'پرداخت جدید';
      case 'report': return 'گزارش تخلف';
      case 'new_user': return 'کاربر جدید';
      case 'review': return 'نظر جدید';
      case 'renewal': return 'درخواست تمدید';
      case 'system': return 'سیستم';
      default: return 'اعلان';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">فوری</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">متوسط</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">عادی</Badge>;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    if (hours < 24) return `${hours} ساعت پیش`;
    if (days < 7) return `${days} روز پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  const handleAction = (notification: AdminNotification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'new_listing':
        // Navigate to listings tab
        toast.info('به بخش آگهی‌ها بروید');
        break;
      case 'new_payment':
        toast.info('به بخش پرداخت‌ها بروید');
        break;
      case 'report':
        toast.info('به بخش گزارش‌ها بروید');
        break;
      default:
        break;
    }
    markAsRead(notification.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-blue-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '۹+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">مرکز اعلان‌ها</h2>
            <p className="text-gray-500 text-sm">
              {unreadCount > 0 ? `${unreadCount} اعلان خوانده نشده` : 'همه اعلان‌ها خوانده شده'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="فیلتر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="unread">خوانده نشده</SelectItem>
              <SelectItem value="new_listing">آگهی جدید</SelectItem>
              <SelectItem value="new_payment">پرداخت</SelectItem>
              <SelectItem value="report">گزارش تخلف</SelectItem>
              <SelectItem value="new_user">کاربر جدید</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadNotifications}>
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 ml-2" />
              خواندن همه
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {notifications.filter(n => n.type === 'new_listing' && !n.is_read).length}
              </p>
              <p className="text-sm text-blue-600">آگهی جدید</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-700">
                {notifications.filter(n => n.type === 'new_payment' && !n.is_read).length}
              </p>
              <p className="text-sm text-green-600">پرداخت جدید</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-700">
                {notifications.filter(n => n.type === 'report' && !n.is_read).length}
              </p>
              <p className="text-sm text-red-600">گزارش تخلف</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 flex items-center gap-3">
            <User className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {notifications.filter(n => n.type === 'new_user' && !n.is_read).length}
              </p>
              <p className="text-sm text-purple-600">کاربر جدید</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">لیست اعلان‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">اعلانی وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                    notification.is_read 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => handleAction(notification)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        notification.is_read ? 'bg-gray-100' : 'bg-white'
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          {getPriorityBadge(notification.priority)}
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationCenter;
