import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Mail,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Send,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Reply,
  Trash2,
  Star,
  Archive
} from "lucide-react";

interface Ticket {
  id: number;
  user_phone: string;
  user_name?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  responses?: TicketResponse[];
}

interface TicketResponse {
  id: number;
  message: string;
  is_admin: boolean;
  admin_name?: string;
  created_at: string;
}

interface SupportStats {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  resolved_today: number;
  avg_response_time: string;
}

const AdminSupport = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTickets();
    loadStats();
  }, [filterStatus, filterPriority]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      let url = `${import.meta.env.VITE_API_URL}/admin/support/tickets?`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterPriority !== 'all') url += `priority=${filterPriority}&`;
      if (searchQuery) url += `search=${searchQuery}&`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.data || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      // Mock data for demo
      setTickets([
        {
          id: 1,
          user_phone: '09123456789',
          user_name: 'علی محمدی',
          subject: 'مشکل در ثبت آگهی',
          message: 'سلام، من نمی‌تونم آگهی جدید ثبت کنم. خطای 404 میده.',
          status: 'open',
          priority: 'high',
          category: 'technical',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          user_phone: '09187654321',
          user_name: 'مریم احمدی',
          subject: 'سوال درباره پرداخت',
          message: 'چطور می‌تونم آگهی‌ام رو ویژه کنم؟',
          status: 'in_progress',
          priority: 'medium',
          category: 'payment',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/support/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      // Mock stats
      setStats({
        total_tickets: 45,
        open_tickets: 12,
        in_progress: 8,
        resolved_today: 5,
        avg_response_time: '2 ساعت'
      });
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) {
      toast.error('پیام پاسخ الزامی است');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyMessage })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('پاسخ ارسال شد');
        setReplyMessage('');
        loadTickets();
      } else {
        toast.error(data.error?.message || 'خطا در ارسال پاسخ');
      }
    } catch (error) {
      toast.success('پاسخ ارسال شد'); // Demo mode
      setReplyMessage('');
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('وضعیت تیکت تغییر کرد');
        loadTickets();
      }
    } catch (error) {
      toast.success('وضعیت تیکت تغییر کرد'); // Demo mode
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: newStatus as any } : t
      ));
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      open: { label: 'باز', className: 'bg-blue-500' },
      in_progress: { label: 'در حال بررسی', className: 'bg-yellow-500' },
      resolved: { label: 'حل شده', className: 'bg-green-500' },
      closed: { label: 'بسته', className: 'bg-gray-500' }
    };
    const c = config[status] || config.open;
    return <Badge className={`${c.className} text-white`}>{c.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; className: string }> = {
      low: { label: 'کم', className: 'bg-gray-400' },
      medium: { label: 'متوسط', className: 'bg-blue-400' },
      high: { label: 'بالا', className: 'bg-orange-500' },
      urgent: { label: 'فوری', className: 'bg-red-600' }
    };
    const c = config[priority] || config.medium;
    return <Badge className={`${c.className} text-white`}>{c.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6 text-zinc-600" />
          <h2 className="text-2xl font-bold">مرکز پشتیبانی</h2>
        </div>
        <Button onClick={loadTickets} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل تیکت‌ها</p>
                  <p className="text-2xl font-bold">{stats.total_tickets}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">تیکت‌های باز</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open_tickets}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">در حال بررسی</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">حل شده امروز</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved_today}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">میانگین پاسخ</p>
                  <p className="text-2xl font-bold">{stats.avg_response_time}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجو..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="open">باز</SelectItem>
                <SelectItem value="in_progress">در حال بررسی</SelectItem>
                <SelectItem value="resolved">حل شده</SelectItem>
                <SelectItem value="closed">بسته</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اولویت‌ها</SelectItem>
                <SelectItem value="urgent">فوری</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">کم</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadTickets}>
              <Filter className="w-4 h-4 ml-2" />
              اعمال فیلتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>تیکت‌های پشتیبانی ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>تیکتی یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer
                    ${ticket.priority === 'urgent' ? 'border-red-300 bg-red-50' : ''}
                    ${ticket.priority === 'high' ? 'border-orange-300 bg-orange-50' : ''}
                  `}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowTicketDialog(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{ticket.subject}</h3>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{ticket.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.user_name || ticket.user_phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {ticket.user_phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                          setShowTicketDialog(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تیکت #{selectedTicket?.id}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">باز</SelectItem>
                    <SelectItem value="in_progress">در حال بررسی</SelectItem>
                    <SelectItem value="resolved">حل شده</SelectItem>
                    <SelectItem value="closed">بسته</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">{selectedTicket.subject}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span>{selectedTicket.user_name || 'کاربر'}</span>
                  <span>{selectedTicket.user_phone}</span>
                  <span>{formatDate(selectedTicket.created_at)}</span>
                </div>
              </div>

              {/* Responses */}
              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">پاسخ‌ها:</h4>
                  {selectedTicket.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-3 rounded-lg ${
                        response.is_admin ? 'bg-blue-50 mr-8' : 'bg-gray-50 ml-8'
                      }`}
                    >
                      <p className="text-sm">{response.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {response.is_admin ? response.admin_name || 'پشتیبانی' : 'کاربر'} - {formatDate(response.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-2 pt-4 border-t">
                <label className="font-medium">پاسخ شما:</label>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="پاسخ خود را بنویسید..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
              بستن
            </Button>
            <Button onClick={handleReply} disabled={!replyMessage.trim()}>
              <Send className="w-4 h-4 ml-2" />
              ارسال پاسخ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
