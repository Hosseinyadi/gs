import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Download, Loader2, TrendingUp, Users, FileText, DollarSign, Calendar } from "lucide-react";

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [financialData, setFinancialData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [listingsData, setListingsData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAllReports();
  }, [dateRange]);

  const loadAllReports = async () => {
    setLoading(true);
    try {
      const [financial, users, listings] = await Promise.all([
        adminApi.getFinancialReport({ 
          start_date: dateRange.start, 
          end_date: dateRange.end 
        }),
        adminApi.getUsersReport({ 
          start_date: dateRange.start, 
          end_date: dateRange.end 
        }),
        adminApi.getListingsReport()
      ]);

      if (financial.success) setFinancialData(financial.data);
      if (users.success) setUsersData(users.data);
      if (listings.success) setListingsData(listings.data);
    } catch (error) {
      toast.error('خطا در بارگذاری گزارش‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      await adminApi.exportReport(type, {
        start_date: dateRange.start,
        end_date: dateRange.end
      });
      toast.success('فایل در حال دانلود است');
    } catch (error) {
      toast.error('خطا در دانلود گزارش');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium">از تاریخ:</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">تا تاریخ:</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-auto"
              />
            </div>
            <Button onClick={loadAllReports} variant="outline">
              بروزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">
            <DollarSign className="w-4 h-4 ml-2" />
            گزارش مالی
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 ml-2" />
            گزارش کاربران
          </TabsTrigger>
          <TabsTrigger value="listings">
            <FileText className="w-4 h-4 ml-2" />
            گزارش آگهی‌ها
          </TabsTrigger>
        </TabsList>

        {/* Financial Report */}
        <TabsContent value="financial">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>خلاصه مالی</CardTitle>
                  <Button onClick={() => handleExport('financial')} size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    دانلود CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">کل درآمد</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatPrice(financialData?.total_revenue || 0)}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">درآمد آگهی‌های ویژه</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatPrice(financialData?.featured_revenue || 0)}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">شارژ کیف پول</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatPrice(financialData?.wallet_revenue || 0)}
                    </p>
                  </div>
                </div>

                {financialData?.daily_revenue && financialData.daily_revenue.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">درآمد روزانه</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-right p-2">تاریخ</th>
                            <th className="text-right p-2">درآمد</th>
                            <th className="text-right p-2">تعداد تراکنش</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialData.daily_revenue.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">{formatDate(item.date)}</td>
                              <td className="p-2">{formatPrice(item.revenue)}</td>
                              <td className="p-2">{item.transactions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Report */}
        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>آمار کاربران</CardTitle>
                  <Button onClick={() => handleExport('users')} size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    دانلود CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">کل کاربران</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {usersData?.total_users || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">کاربران جدید</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {usersData?.new_users || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">کاربران فعال</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {usersData?.active_users || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">نرخ رشد</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      {usersData?.growth_rate || 0}%
                    </p>
                  </div>
                </div>

                {usersData?.daily_registrations && usersData.daily_registrations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">ثبت‌نام روزانه</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-right p-2">تاریخ</th>
                            <th className="text-right p-2">تعداد ثبت‌نام</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersData.daily_registrations.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">{formatDate(item.date)}</td>
                              <td className="p-2">{item.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Listings Report */}
        <TabsContent value="listings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>آمار آگهی‌ها</CardTitle>
                  <Button onClick={() => handleExport('listings')} size="sm">
                    <Download className="w-4 h-4 ml-2" />
                    دانلود CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">کل آگهی‌ها</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {listingsData?.total_listings || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">آگهی‌های فعال</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {listingsData?.active_listings || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">آگهی‌های ویژه</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {listingsData?.featured_listings || 0}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">در انتظار تأیید</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {listingsData?.pending_listings || 0}
                    </p>
                  </div>
                </div>

                {listingsData?.by_category && listingsData.by_category.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">آگهی‌ها بر اساس دسته‌بندی</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-right p-2">دسته‌بندی</th>
                            <th className="text-right p-2">تعداد</th>
                            <th className="text-right p-2">درصد</th>
                          </tr>
                        </thead>
                        <tbody>
                          {listingsData.by_category.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">{item.category}</td>
                              <td className="p-2">{item.count}</td>
                              <td className="p-2">{item.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
