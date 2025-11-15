import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCheck, Mail, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";

interface Message {
  id: number;
  user_name: string;
  user_phone: string;
  user_email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
  replied_at?: string;
  reply_text?: string;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getContactMessages({ page: 1, limit: 50 });
      if (response.success && response.data?.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('خطا در بارگذاری پیام‌ها');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">جدید</Badge>;
      case 'read':
        return <Badge variant="default">خوانده شده</Badge>;
      case 'replied':
        return <Badge className="bg-green-500">پاسخ داده شده</Badge>;
      default:
        return null;
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      toast.error('لطفاً پاسخ را بنویسید');
      return;
    }

    setSending(true);
    const toastId = toast.loading('در حال ارسال پاسخ...');

    try {
      const response = await adminApi.replyToContactMessage(selectedMessage.id, replyText);
      
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('پاسخ با موفقیت ارسال شد');
        setReplyText('');
        setSelectedMessage(null);
        await loadMessages();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ارسال پاسخ');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (message: Message) => {
    setSelectedMessage(message);
    
    if (message.status === 'new') {
      try {
        const response = await adminApi.markContactMessageAsRead(message.id);
        if (response.success) {
          setMessages(messages.map(m => 
            m.id === message.id ? { ...m, status: 'read' } : m
          ));
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const newMessagesCount = messages.filter(m => m.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">مدیریت پیام‌ها</h2>
        </div>
        <Button onClick={loadMessages} variant="outline" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 ml-2" />
          )}
          بروزرسانی
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>پیام‌ها</span>
                {newMessagesCount > 0 && (
                  <Badge variant="destructive">{newMessagesCount} جدید</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>پیامی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMessage?.id === message.id
                      ? 'bg-primary/10 border-primary'
                      : message.status === 'new'
                      ? 'bg-red-50 hover:bg-red-100'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => markAsRead(message)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm">{message.user_name}</p>
                    {getStatusBadge(message.status)}
                  </div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">{message.subject}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{message.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(message.created_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail & Reply */}
        <div className="lg:col-span-2">
        {selectedMessage ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>جزئیات پیام</span>
                {getStatusBadge(selectedMessage.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sender Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">فرستنده</p>
                  <p className="font-medium">{selectedMessage.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">شماره تماس</p>
                  <p className="font-medium" dir="ltr">{selectedMessage.user_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ایمیل</p>
                  <p className="font-medium text-sm">{selectedMessage.user_email}</p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-sm text-gray-500 mb-1">موضوع</p>
                <p className="font-semibold text-lg">{selectedMessage.subject}</p>
              </div>

              {/* Message */}
              <div>
                <p className="text-sm text-gray-500 mb-2">پیام</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Previous Reply */}
              {selectedMessage.status === 'replied' && selectedMessage.reply_text && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">پاسخ قبلی</p>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.reply_text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedMessage.replied_at && new Date(selectedMessage.replied_at).toLocaleString('fa-IR')}
                    </p>
                  </div>
                </div>
              )}

              {/* Reply Section */}
              <div>
                <p className="text-sm text-gray-500 mb-2">پاسخ</p>
                <Textarea
                  placeholder="پاسخ خود را بنویسید..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={5}
                  className="mb-3"
                />
                <Button onClick={handleReply} className="w-full" disabled={sending}>
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-2" />
                      ارسال پاسخ
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">یک پیام را انتخاب کنید</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
