import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import adminApi, { AuditLog } from "@/services/admin-api";
import { Search, Loader2, Calendar, User, Activity } from "lucide-react";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    admin_id: '',
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 50
      };

      if (filters.action !== 'all') params.action = filters.action;
      if (filters.admin_id) params.admin_id = parseInt(filters.admin_id);
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await adminApi.getAuditLogs(params);
      if (response.success && response.data) {
        setLogs(response.data.logs || []);
        setTotalPages(response.data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('خطا در بارگذاری لاگ‌ها');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await adminApi.getAuditSummary(7);
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }, []);

  useEffect(() => {
    loadLogs();
    loadSummary();
  }, [loadLogs, loadSummary]);

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { variant: any; label: string }> = {
      create_listing: { variant: 'default', label: 'ایجاد آگهی' },
      update_listing: { variant: 'secondary', label: 'ویرایش آگهی' },
      delete_listing: { variant: 'destructive', label: 'حذف آگهی' },
      approve_listing: { variant: 'default', label: 'تأیید آگهی' },
      reject_listing: { variant: 'destructive', label: 'رد آگهی' },
      block_user: { variant: 'destructive', label: 'مسدود کاربر' },
      unblock_user: { variant: 'default', label: 'رفع مسدودیت' },
      adjust_wallet: { variant: 'secondary', label: 'تنظیم کیف پول' },
      update_settings: { variant: 'secondary', label: 'تغییر تنظیمات' },
      create_discount: { variant: 'default', label: 'ایجاد تخفیف' },
      approve_provider: { variant: 'default', label: 'تأیید ارائه‌دهنده' },
      reject_provider: { variant: 'destructive', label: 'رد ارائه‌دهنده' }
    };
    const config = actionMap[action] || { variant: 'outline', label: action };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR');
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">کل فعالیت‌ها</span>
              </div>
              <p className="text-2xl font-bold">{summary.total_actions || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm">ادمین‌های فعال</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{summary.active_admins || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">فعالیت امروز</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{summary.today_actions || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">فعالیت این هفته</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{summary.week_actions || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجو..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pr-10"
              />
            </div>

            <Select value={filters.action} onValueChange={(v) => setFilters({ ...filters, action: v })}>
              <SelectTrigger>
                <SelectValue placeholder="نوع عملیات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="create_listing">ایجاد آگهی</SelectItem>
                <SelectItem value="approve_listing">تأیید آگهی</SelectItem>
                <SelectItem value="delete_listing">حذف آگهی</SelectItem>
                <SelectItem value="block_user">مسدود کاربر</SelectItem>
                <SelectItem value="update_settings">تغییر تنظیمات</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>

            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />

            <Button onClick={loadLogs} variant="outline">
              <Search className="w-4 h-4 ml-2" />
              جستجو
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>لاگ فعالیت‌ها ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لاگی یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4">زمان</th>
                    <th className="text-right p-4">ادمین</th>
                    <th className="text-right p-4">عملیات</th>
                    <th className="text-right p-4">هدف</th>
                    <th className="text-right p-4">جزئیات</th>
                    <th className="text-right p-4">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{log.admin_name || log.username}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="p-4">
                        {log.target_type && log.target_id && (
                          <span className="text-sm text-gray-600">
                            {log.target_type} #{log.target_id}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {log.details && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-blue-600">مشاهده</summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                قبلی
              </Button>
              <span className="px-4 py-2">
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                بعدی
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLogs;
