import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Crown, 
  Star, 
  Award, 
  TrendingUp, 
  Users, 
  DollarSign,
  Gift,
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  ShoppingBag,
  Target
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";

interface LoyalCustomer {
  user_id: number;
  phone: string;
  name: string;
  email: string;
  total_payments: number;
  total_spent: number;
  average_payment: number;
  unique_listings: number;
  featured_count: number;
  purchased_plans: string;
  first_payment_date: string;
  last_payment_date: string;
  rank: number;
  loyalty_score: number;
  customer_tier: string;
}

interface LoyalCustomersStats {
  total_customers: number;
  total_payments: number;
  total_revenue: number;
  average_payment: number;
  featured_purchases: number;
  tier_breakdown: Record<string, { count: number; total_spent: number }>;
  top_customers: LoyalCustomer[];
}

const AdminLoyalCustomers = () => {
  const [customers, setCustomers] = useState<LoyalCustomer[]>([]);
  const [stats, setStats] = useState<LoyalCustomersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<LoyalCustomer | null>(null);
  const [message, setMessage] = useState('');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [discountDays, setDiscountDays] = useState(30);

  useEffect(() => {
    loadLoyalCustomers();
  }, [selectedMonth, selectedYear]);

  const loadLoyalCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.request(`/admin/loyal-customers?month=${selectedMonth}&year=${selectedYear}`);
      
      if (response.success) {
        setCustomers(response.data.customers);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading loyal customers:', error);
      toast.error('خطا در بارگذاری مشتریان وفادار');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedCustomer || !message.trim()) {
      toast.error('لطفاً پیام را وارد کنید');
      return;
    }

    try {
      const response = await apiService.request('/admin/loyal-customers/send-message', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedCustomer.user_id,
          message: message.trim()
        })
      });

      if (response.success) {
        toast.success('پیام تشکر با موفقیت ارسال شد');
        setShowMessageDialog(false);
        setMessage('');
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('خطا در ارسال پیام');
    }
  };

  const handleGrantDiscount = async () => {
    if (!selectedCustomer || discountPercent < 1 || discountPercent > 50) {
      toast.error('درصد تخفیف باید بین 1 تا 50 باشد');
      return;
    }

    try {
      const response = await apiService.request('/admin/loyal-customers/grant-discount', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedCustomer.user_id,
          discount_percent: discountPercent,
          valid_days: discountDays
        })
      });

      if (response.success) {
        toast.success(`کد تخفیف ${discountPercent}% برای مشتری ایجاد شد`);
        setShowDiscountDialog(false);
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('Error granting discount:', error);
      toast.error('خطا در اعطای تخفیف');
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'طلایی': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'نقره‌ای': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'برنزی': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'طلایی': return <Crown className="w-4 h-4" />;
      case 'نقره‌ای': return <Award className="w-4 h-4" />;
      case 'برنزی': return <Star className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-yellow-600" />
          <div>
            <h1 className="text-2xl font-bold">مشتریان وفادار</h1>
            <p className="text-gray-600">مدیریت و تشویق مشتریان پرخرید</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  {new Date(2024, i).toLocaleDateString('fa-IR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => (
                <SelectItem key={2024 - i} value={(2024 - i).toString()}>
                  {2024 - i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.total_customers}
              </div>
              <div className="text-sm text-gray-600">مشتری وفادار</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {(stats.total_revenue / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-600">درآمد کل (تومان)</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.total_payments}
              </div>
              <div className="text-sm text-gray-600">کل پرداخت‌ها</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {Math.round(stats.average_payment / 1000)}K
              </div>
              <div className="text-sm text-gray-600">میانگین پرداخت</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {stats.featured_purchases}
              </div>
              <div className="text-sm text-gray-600">خرید ویژه‌سازی</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tier Breakdown */}
      {stats && stats.tier_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              توزیع سطح مشتریان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.tier_breakdown).map(([tier, data]) => (
                <div key={tier} className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getTierIcon(tier)}
                  </div>
                  <div className="font-semibold">{tier}</div>
                  <div className="text-2xl font-bold text-blue-600">{data.count}</div>
                  <div className="text-sm text-gray-600">
                    {formatCurrency(data.total_spent)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            لیست مشتریان وفادار
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>مشتری وفاداری در این ماه یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div key={customer.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                      <span className="text-lg font-bold text-blue-600">#{customer.rank}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {customer.name || 'کاربر'}
                        </span>
                        <Badge className={`${getTierColor(customer.customer_tier)} flex items-center gap-1`}>
                          {getTierIcon(customer.customer_tier)}
                          {customer.customer_tier}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{customer.total_payments} پرداخت</span>
                        <span>{formatCurrency(customer.total_spent)}</span>
                        <span>{customer.featured_count} ویژه‌سازی</span>
                        <span>امتیاز: {customer.loyalty_score}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowMessageDialog(true);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 ml-1" />
                      پیام تشکر
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowDiscountDialog(true);
                      }}
                    >
                      <Gift className="w-4 h-4 ml-1" />
                      اعطای تخفیف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              ارسال پیام تشکر
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCustomer && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedCustomer.name || 'کاربر'}</div>
                <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                <div className="text-sm text-gray-600">
                  {selectedCustomer.total_payments} پرداخت - {formatCurrency(selectedCustomer.total_spent)}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="message">پیام تشکر</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="پیام تشکر خود را برای این مشتری وفادار بنویسید..."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMessageDialog(false)}
            >
              انصراف
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              ارسال پیام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Discount Dialog */}
      <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              اعطای تخفیف ویژه
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCustomer && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedCustomer.name || 'کاربر'}</div>
                <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                <Badge className={`${getTierColor(selectedCustomer.customer_tier)} mt-1`}>
                  {selectedCustomer.customer_tier}
                </Badge>
              </div>
            )}
            
            <div>
              <Label htmlFor="discountPercent">درصد تخفیف</Label>
              <Input
                id="discountPercent"
                type="number"
                min="1"
                max="50"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 10)}
                className="mt-1"
              />
              <div className="text-xs text-gray-500 mt-1">بین 1 تا 50 درصد</div>
            </div>
            
            <div>
              <Label htmlFor="discountDays">مدت اعتبار (روز)</Label>
              <Input
                id="discountDays"
                type="number"
                min="1"
                max="365"
                value={discountDays}
                onChange={(e) => setDiscountDays(parseInt(e.target.value) || 30)}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDiscountDialog(false)}
            >
              انصراف
            </Button>
            <Button 
              onClick={handleGrantDiscount}
              className="bg-green-600 hover:bg-green-700"
            >
              اعطای تخفیف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLoyalCustomers;