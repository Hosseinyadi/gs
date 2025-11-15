import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  TrendingUp,
  DollarSign,
  Users,
  Star,
  CreditCard,
  Tag,
  Calendar,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [overview, setOverview] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any>(null);
  const [featuredData, setFeaturedData] = useState<any>(null);
  const [discountsData, setDiscountsData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load all analytics in parallel
      const [overviewRes, revenueRes, paymentsRes, featuredRes, discountsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/overview`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/revenue?days=${period}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/payments?days=${period}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/featured?days=${period}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/admin/analytics/discounts?days=${period}`, { headers })
      ]);

      const [overview, revenue, payments, featured, discounts] = await Promise.all([
        overviewRes.json(),
        revenueRes.json(),
        paymentsRes.json(),
        featuredRes.json(),
        discountsRes.json()
      ]);

      if (overview.success) setOverview(overview.data);
      if (revenue.success) setRevenueData(revenue.data);
      if (payments.success) setPaymentsData(payments.data);
      if (featured.success) setFeaturedData(featured.data);
      if (discounts.success) setDiscountsData(discounts.data);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('خطا در بارگذاری آمار');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">داشبورد آنالیتیکس</h1>
          <p className="text-gray-600 mt-1">آمار و گزارش‌های سیستم</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 روز اخیر</SelectItem>
            <SelectItem value="30">30 روز اخیر</SelectItem>
            <SelectItem value="90">90 روز اخیر</SelectItem>
            <SelectItem value="365">یک سال اخیر</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل درآمد</p>
                  <p className="text-2xl font-bold">{formatPrice(overview.revenue.total)}</p>
                  <p className="text-xs text-gray-500 mt-1">تومان</p>
                </div>
                <DollarSign className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">درآمد این ماه</p>
                  <p className="text-2xl font-bold">{formatPrice(overview.revenue.this_month)}</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    نسبت به ماه قبل
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">کل کاربران</p>
                  <p className="text-2xl font-bold">{overview.users.total}</p>
                  <p className="text-xs text-gray-500 mt-1">کاربر ثبت‌نام شده</p>
                </div>
                <Users className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">آگهی‌های ویژه</p>
                  <p className="text-2xl font-bold">{overview.listings.featured}</p>
                  <p className="text-xs text-gray-500 mt-1">از {overview.listings.total} آگهی</p>
                </div>
                <Star className="w-10 h-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      {revenueData && (
        <Card>
          <CardHeader>
            <CardTitle>نمودار درآمد</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.revenue_chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatPrice(value)} />
                <Legend />
                <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" name="درآمد" />
                <Line type="monotone" dataKey="total_discount" stroke="#82ca9d" name="تخفیف" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Payment Status */}
        {paymentsData && (
          <Card>
            <CardHeader>
              <CardTitle>وضعیت پرداخت‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentsData.status_breakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {paymentsData.status_breakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">نرخ موفقیت</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatPercent(paymentsData.success_rate)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Featured Plans Usage */}
        {featuredData && (
          <Card>
            <CardHeader>
              <CardTitle>استفاده از پلن‌های ویژه</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={featuredData.plans_usage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="usage_count" fill="#8884d8" name="تعداد استفاده" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Discount Codes */}
      {discountsData && discountsData.top_codes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>پرکاربردترین کدهای تخفیف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {discountsData.top_codes.map((code: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Tag className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-mono font-bold">{code.code}</p>
                      <p className="text-sm text-gray-600">
                        {code.discount_type === 'percentage' ? `${code.discount_value}%` : `${formatPrice(code.discount_value)} تومان`}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{code.usage_count} استفاده</p>
                    <p className="text-sm text-gray-600">{formatPrice(code.total_discount_given)} تومان تخفیف</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalyticsDashboard;
