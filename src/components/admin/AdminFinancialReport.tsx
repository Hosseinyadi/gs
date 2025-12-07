import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart
} from "lucide-react";

interface RevenueByType {
  type: string;
  count: number;
  total_amount: number;
}

interface TimelineItem {
  period: string;
  transaction_count: number;
  total_amount: number;
  type: string;
}

interface Summary {
  total_transactions: number;
  total_revenue: number;
  avg_transaction: number;
  min_transaction: number;
  max_transaction: number;
}

interface FinancialData {
  revenue_by_type: RevenueByType[];
  timeline: TimelineItem[];
  summary: Summary;
}

function AdminFinancialReport() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    loadFinancialData();
  }, [period, reportType]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Calculate date range based on period
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/reports/financial?start_date=${startDate}&end_date=${endDate}&type=${reportType}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const result = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast.error(result.message || 'خطا در بارگذاری گزارش مالی');
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '0';
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (dateString: string) => {
    // Handle different date formats
    if (dateString.includes('-W')) {
      // Weekly format: 2024-W45
      return `هفته ${dateString.split('-W')[1]}`;
    }
    if (dateString.match(/^\d{4}-\d{2}$/)) {
      // Monthly format: 2024-12
      const [year, month] = dateString.split('-');
      const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    // Daily format
    return new Date(dateString).toLocaleDateString('fa-IR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      try {
        const token = localStorage.getItem('adminToken');
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/reports/export/transactions?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
          toast.success('گزارش CSV دانلود شد');
        } else {
          const result = await response.json();
          toast.error(result.message || 'خطا در دانلود گزارش');
        }
      } catch (error) {
        console.error('Export error:', error);
        toast.error('خطا در دانلود گزارش');
      }
    } else {
      toast.info('گزارش PDF در حال آماده‌سازی...');
    }
  };

  // Calculate stats from data
  const totalRevenue = data?.summary?.total_revenue || 0;
  const totalTransactions = data?.summary?.total_transactions || 0;
  const avgTransaction = data?.summary?.avg_transaction || 0;
  
  // Group timeline by period for chart
  const chartData = data?.timeline?.reduce((acc: any[], item) => {
    const existing = acc.find(a => a.period === item.period);
    if (existing) {
      existing.amount += item.total_amount || 0;
      existing.count += item.transaction_count || 0;
    } else {
      acc.push({
        period: item.period,
        amount: item.total_amount || 0,
        count: item.transaction_count || 0
      });
    }
    return acc;
  }, []) || [];

  // Sort by period
  chartData.sort((a, b) => a.period.localeCompare(b.period));

  // Calculate max for chart
  const maxAmount = Math.max(...chartData.map(d => d.amount), 1);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          گزارش مالی تفصیلی
        </h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">۷ روز</SelectItem>
              <SelectItem value="30">۳۰ روز</SelectItem>
              <SelectItem value="90">۹۰ روز</SelectItem>
            </SelectContent>
          </Select>
          <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">روزانه</SelectItem>
              <SelectItem value="weekly">هفتگی</SelectItem>
              <SelectItem value="monthly">ماهانه</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadFinancialData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('csv')}>
            <Download className="w-4 h-4 ml-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">درآمد کل</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(totalRevenue)}
                </p>
                <p className="text-xs text-gray-400">تومان</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تعداد تراکنش</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(totalTransactions)}
                </p>
                <p className="text-xs text-gray-400">تراکنش</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">میانگین تراکنش</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPrice(Math.round(avgTransaction))}
                </p>
                <p className="text-xs text-gray-400">تومان</p>
              </div>
              <CreditCard className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">حداکثر تراکنش</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatPrice(data?.summary?.max_transaction || 0)}
                </p>
                <p className="text-xs text-gray-400">تومان</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نمودار درآمد */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            نمودار درآمد {reportType === 'daily' ? 'روزانه' : reportType === 'weekly' ? 'هفتگی' : 'ماهانه'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>داده‌ای برای نمایش وجود ندارد</p>
            </div>
          ) : (
            <div className="h-64 flex items-end gap-1">
              {chartData.map((day, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group"
                >
                  <div className="relative w-full">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                      style={{
                        height: `${(day.amount / maxAmount) * 200}px`,
                        minHeight: '4px'
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        <div>{formatPrice(day.amount)} تومان</div>
                        <div>{day.count} تراکنش</div>
                      </div>
                    </div>
                  </div>
                  {index % Math.ceil(chartData.length / 10) === 0 && (
                    <span className="text-xs text-gray-400 mt-1 transform -rotate-45">
                      {formatDate(day.period)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* آمار بر اساس نوع */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              درآمد بر اساس نوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.revenue_by_type && data.revenue_by_type.length > 0 ? (
              <div className="space-y-4">
                {data.revenue_by_type.map((item, index) => {
                  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500'];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                        {item.type === 'featured' ? 'ویژه‌سازی' : 
                         item.type === 'renewal' ? 'تمدید' : 
                         item.type === 'listing' ? 'ثبت آگهی' : item.type}
                      </span>
                      <div className="text-left">
                        <span className="font-bold">{formatPrice(item.total_amount)} تومان</span>
                        <span className="text-sm text-gray-500 mr-2">({item.count} تراکنش)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">داده‌ای موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>خلاصه آماری</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">کل تراکنش‌ها</span>
                <span className="font-bold">
                  {formatPrice(totalTransactions)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">کل درآمد</span>
                <span className="font-bold text-green-600">
                  {formatPrice(totalRevenue)} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">میانگین هر تراکنش</span>
                <span className="font-bold text-blue-600">
                  {formatPrice(Math.round(avgTransaction))} تومان
                </span>
              </div>
              <hr />
              <div className="flex items-center justify-between">
                <span className="text-gray-600">کمترین تراکنش</span>
                <span className="font-bold">
                  {formatPrice(data?.summary?.min_transaction || 0)} تومان
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">بیشترین تراکنش</span>
                <span className="font-bold">
                  {formatPrice(data?.summary?.max_transaction || 0)} تومان
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminFinancialReport;
