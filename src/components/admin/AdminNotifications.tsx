import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Users, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const AdminNotifications = () => {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getBroadcastNotifications({ page: 1, limit: 10 });
      if (response.success && response.data?.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!notification.title || !notification.message) {
      toast.error('لطفاً عنوان و متن اعلان را وارد کنید');
      return;
    }

    setSending(true);
    const toastId = toast.loading('در حال ارسال اعلان...');

    try {
      const response = await adminApi.sendBroadcastNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type
      });

      if (response.success) {
        toast.dismiss(toastId);
        toast.success('اعلان با موفقیت به همه کاربران ارسال شد');
        setNotification({ title: '', message: '', type: 'info' });
        await loadNotifications();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ارسال اعلان');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-orange-500" />
        <h2 className="text-2xl font-bold">مدیریت اعلان‌ها</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            ارسال اعلان عمومی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">عنوان اعلان:</label>
            <Input
              value={notification.title}
              onChange={(e) => setNotification({...notification, title: e.target.value})}
              placeholder="عنوان اعلان را وارد کنید"
            />
          </div>

          <div>
            <label className="text-sm font-medium">متن اعلان:</label>
            <Textarea
              value={notification.message}
              onChange={(e) => setNotification({...notification, message: e.target.value})}
              placeholder="متن کامل اعلان را وارد کنید"
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">نوع اعلان:</label>
            <select
              className="w-full p-2 border rounded"
              value={notification.type}
              onChange={(e) => setNotification({...notification, type: e.target.value})}
            >
              <option value="info">اطلاعات</option>
              <option value="warning">هشدار</option>
              <option value="success">موفقیت</option>
              <option value="error">خطا</option>
            </select>
          </div>

          <Button onClick={handleSend} className="w-full" disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال ارسال...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 ml-2" />
                ارسال اعلان به همه کاربران
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آخرین اعلان‌های ارسال شده</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>هنوز اعلانی ارسال نشده است</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 border rounded">
                  <h4 className="font-medium">{notif.title}</h4>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                      {notif.type === 'info' ? 'اطلاعات' :
                       notif.type === 'warning' ? 'هشدار' :
                       notif.type === 'success' ? 'موفقیت' : 'خطا'}
                    </span>
                    <p className="text-xs text-gray-400">
                      {new Date(notif.created_at).toLocaleDateString('fa-IR')} - {new Date(notif.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
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

export default AdminNotifications;
