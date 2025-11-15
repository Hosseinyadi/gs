import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Send, Loader2, Bell, MessageSquare } from "lucide-react";

const AdminNotificationBroadcast = () => {
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all',
    sendSMS: false,
    sendInApp: true
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast.error('عنوان و متن پیام الزامی است');
      return;
    }

    setSending(true);
    try {
      const response = await adminApi.sendBroadcastNotification({
        title: formData.title,
        message: formData.message,
        target: formData.target,
        channels: {
          sms: formData.sendSMS,
          in_app: formData.sendInApp
        }
      });

      if (response.success) {
        toast.success(`اعلان به ${response.data?.sent_count || 0} کاربر ارسال شد`);
        setFormData({
          title: '',
          message: '',
          target: 'all',
          sendSMS: false,
          sendInApp: true
        });
      }
    } catch (error) {
      toast.error('خطا در ارسال اعلان');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            ارسال اعلان سراسری
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="text-sm font-medium">عنوان اعلان *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان اعلان"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">متن پیام *</label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="متن کامل پیام"
                rows={6}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">مخاطبان</label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="all">همه کاربران</option>
                <option value="verified">کاربران تأیید شده</option>
                <option value="active">کاربران فعال</option>
                <option value="sellers">فروشندگان</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">کانال‌های ارسال</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendInApp}
                    onChange={(e) => setFormData({ ...formData, sendInApp: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Bell className="w-4 h-4" />
                  <span>اعلان درون‌برنامه‌ای</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendSMS}
                    onChange={(e) => setFormData({ ...formData, sendSMS: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <MessageSquare className="w-4 h-4" />
                  <span>پیامک (SMS)</span>
                </label>
              </div>
            </div>

            <Button type="submit" disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  ارسال اعلان
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationBroadcast;
