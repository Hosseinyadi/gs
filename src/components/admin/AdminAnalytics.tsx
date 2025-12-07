import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Eye,
  DollarSign,
  Calendar,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown,
  Clock,
  Star,
  MapPin
} from "lucide-react";

interface AnalyticsData {
  overview: {
    total_users: number;
    new_users_today: number;
    new_users_week: number;
    user_growth: number;
    total_listings: number;
    new_listings_today: number;
    new_listings_week: number;
    listing_growth: number;
    total_views: number;
    views_today: number;
    views_week: number;
    view_growth: number;
    total_revenue: number;
    revenue_today: number;
    revenue_week: number;
    revenue_growth: number;
  };
  charts: {
    daily_users: { date: string; count: number }[];
    daily_listings: { date: string; count: number }[];
    daily_views: { date: string; count: number }[];
    daily_revenue: { date: string; amount: number }[];
  };
  top_categories: { name: string; count: number; percentage: number }[];
  top_locations: { name: string; count: number }[];
  user_activity: { hour: number; count: number }[];
}

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/analytics?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Mock data for demo
      setData({
        overview: {
          total_users: 1250,
          new_users_today: 15,
          new_users_week: 87,
          user_growth: 12.5,
          total_listings: 3420,
          new_listings_today: 28,
          new_listings_week: 156,
          listing_growth: 8.3,
          total_views: 45600,
          views_today: 1230,
          views_week: 8540,
          view_growth: 15.2,
          total_revenue: 12500000,
          revenue_today: 450000,
          revenue_week: 2800000,
          revenue_growth: 22.4
        },
        charts: {
          daily_users: [
            { date: '۱۴۰۳/۰۹/۲۳', count: 12 },
            { date: '۱۴۰۳/۰۹/۲۴', count: 18 },
            { date: '۱۴۰۳/۰۹/۲۵', count: 15 },
            { date: '۱۴۰۳/۰۹/۲۶', count: 22 },
            { date: '۱۴۰۳/۰۹/۲۷', count: 19 },
            { date: '۱۴۰۳/۰۹/۲۸', count: 25 },
            { date: '۱۴۰۳/۰۹/۲۹', count: 15 }
          ],
          daily_listings: [
            { date: '۱۴۰۳/۰۹/۲۳', count: 22 },
            { date: '۱۴۰۳/۰۹/۲۴', count: 28 },
            { date: '۱۴۰۳/۰۹/۲۵', count: 25 },
            { date: '۱۴۰۳/۰۹/۲۶', count: 32 },
            { date: '۱۴۰۳/۰۹/۲۷', count: 29 },
            { date: '۱۴۰۳/۰۹/۲۸', count: 35 },
            { date: '۱۴۰۳/۰۹/۲۹', count: 28 }
          ],
          daily_views: [
            { date: '۱۴۰۳/۰۹/۲۳', count: 1100 },
            { date: '۱۴۰۳/۰۹/۲۴', count: 1350 },
            { date: '۱۴۰۳/۰۹/۲۵', count: 1200 },
            { date: '۱۴۰۳/۰۹/۲۶', count: 1450 },
            { date: '۱۴۰۳/۰۹/۲۷', count: 1380 },
            { date: '۱۴۰۳/۰۹/۲۸', count: 1520 },
            { date: '۱۴۰۳/۰۹/۲۹', count: 1230 }
          ],
          daily_revenue: [
            { date: '۱۴۰۳/۰۹/۲۳', amount: 350000 },
            { date: '۱۴۰۳/۰۹/۲۴', amount: 420000 },
            { date: '۱۴۰۳/۰۹/۲۵', amount: 380000 },
            { date: '۱۴۰۳/۰۹/۲۶', amount: 520000 },
            { date: '۱۴۰۳/۰۹/۲۷', amount: 480000 },
            { date: '۱۴۰۳/۰۹/۲۸', amount: 550000 },
            { date: '۱۴۰۳/۰۹/۲۹', amount: 450000 }
          ]
        },
        top_categories: [
          { name: 'بیل مکانیکی', count: 450, percentage: 28 },
          { name: 'لودر', count: 380, percentage: 24 },
          { name: 'کامیون', count: 320, percentage: 20 },
          { name: 'جرثقیل', count: 250, percentage: 16 },
          { name: 'سایر', count: 200, percentage: 12 }
        ],
        top_locations: [
          { name: 'تهران', count: 520 },
          { name: 'اصفهان', count: 280 },
          { name: 'مشهد', count: 220 },
          { name: 'تبریز', count: 180 },
          { name: 'شیراز', count: 150 }
        ],
        user_activity: [
          { hour: 8, count: 45 },
          { hour: 9, count: 78 },
          { hour: 10, count: 120 },
          { hour: 11, count: 145 },
          { hour: 12, count: 98 },
          { hour: 13, count: 65 },
          { hour: 14, count: 88 },
          { hour: 15, count: 132 },
          { hour: 16, count: 156 },
          { hour: 17, count: 178 },
          { hour: 18, count: 145 },
          { hour: 19, count: 112 },
          { hour: 20, count: 89 },
          { hour: 21, count: 67 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(num);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} میلیون`;
    }
    return formatNumber(price) + ' تومان';
  };

  const GrowthIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
        <span>{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data, valueKey, labelKey, color = 'bg-blue-500' }: any) => {
    const maxValue = Math.max(...data.map((d: any) => d[valueKey]));
    return (
      <div className="space-y-2">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs w-20 text-gray-600">{item[labelKey]}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-4">
              <div
                className={`${color} h-4 rounded-full transition-all`}
                style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs w-16 text-left">{formatNumber(item[valueKey])}</span>
          </div>
        ))}
      </div>
    );
  };

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-sky-600" />
          <h2 className="text-2xl font-bold">آنالیز و گزارشات</h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">امروز</SelectItem>
              <SelectItem value="week">هفته</SelectItem>
              <SelectItem value="month">ماه</SelectItem>
              <SelectItem value="year">سال</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 ml-2" />
            خروجی
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="users">کاربران</TabsTrigger>
          <TabsTrigger value="listings">آگهی‌ها</TabsTrigger>
          <TabsTrigger value="revenue">درآمد</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-t-4 border-t-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">کل کاربران</p>
                    <p className="text-3xl font-bold">{formatNumber(data.overview.total_users)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      +{data.overview.new_users_today} امروز
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="p-3 bg-blue-100 rounded-full mb-2">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <GrowthIndicator value={data.overview.user_growth} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">کل آگهی‌ها</p>
                    <p className="text-3xl font-bold">{formatNumber(data.overview.total_listings)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      +{data.overview.new_listings_today} امروز
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="p-3 bg-green-100 rounded-full mb-2">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <GrowthIndicator value={data.overview.listing_growth} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">کل بازدیدها</p>
                    <p className="text-3xl font-bold">{formatNumber(data.overview.total_views)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      +{formatNumber(data.overview.views_today)} امروز
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="p-3 bg-purple-100 rounded-full mb-2">
                      <Eye className="w-6 h-6 text-purple-600" />
                    </div>
                    <GrowthIndicator value={data.overview.view_growth} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">کل درآمد</p>
                    <p className="text-3xl font-bold">{formatPrice(data.overview.total_revenue)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      +{formatPrice(data.overview.revenue_today)} امروز
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="p-3 bg-orange-100 rounded-full mb-2">
                      <DollarSign className="w-6 h-6 text-orange-600" />
                    </div>
                    <GrowthIndicator value={data.overview.revenue_growth} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  دسته‌بندی‌های پرطرفدار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={data.top_categories}
                  valueKey="count"
                  labelKey="name"
                  color="bg-blue-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  موقعیت‌های پرآگهی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleBarChart
                  data={data.top_locations}
                  valueKey="count"
                  labelKey="name"
                  color="bg-green-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                فعالیت کاربران در طول روز
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between h-40 gap-1">
                {data.user_activity.map((item, index) => {
                  const maxCount = Math.max(...data.user_activity.map(a => a.count));
                  const height = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-sky-500 rounded-t transition-all hover:bg-sky-600"
                        style={{ height: `${height}%` }}
                        title={`${item.count} فعالیت`}
                      />
                      <span className="text-xs text-gray-500 mt-1">{item.hour}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">ساعت روز</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold">{formatNumber(data.overview.total_users)}</p>
                <p className="text-gray-600">کل کاربران</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">{data.overview.new_users_week}</p>
                <p className="text-gray-600">کاربران جدید این هفته</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="w-12 h-12 mx-auto text-purple-500 mb-2" />
                <p className="text-3xl font-bold">{data.overview.user_growth.toFixed(1)}%</p>
                <p className="text-gray-600">رشد کاربران</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>روند ثبت‌نام کاربران</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={data.charts.daily_users}
                valueKey="count"
                labelKey="date"
                color="bg-blue-500"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Listings Tab */}
        <TabsContent value="listings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">{formatNumber(data.overview.total_listings)}</p>
                <p className="text-gray-600">کل آگهی‌ها</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                <p className="text-3xl font-bold">{data.overview.new_listings_week}</p>
                <p className="text-gray-600">آگهی‌های جدید این هفته</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Eye className="w-12 h-12 mx-auto text-purple-500 mb-2" />
                <p className="text-3xl font-bold">{formatNumber(data.overview.total_views)}</p>
                <p className="text-gray-600">کل بازدیدها</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>روند ثبت آگهی</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={data.charts.daily_listings}
                valueKey="count"
                labelKey="date"
                color="bg-green-500"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 mx-auto text-orange-500 mb-2" />
                <p className="text-3xl font-bold">{formatPrice(data.overview.total_revenue)}</p>
                <p className="text-gray-600">کل درآمد</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">{formatPrice(data.overview.revenue_week)}</p>
                <p className="text-gray-600">درآمد این هفته</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold">{data.overview.revenue_growth.toFixed(1)}%</p>
                <p className="text-gray-600">رشد درآمد</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>روند درآمد روزانه</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={data.charts.daily_revenue}
                valueKey="amount"
                labelKey="date"
                color="bg-orange-500"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
