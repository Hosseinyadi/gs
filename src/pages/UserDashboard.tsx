import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import apiService from "@/services/api";
import { toast } from "sonner";
import { 
  User, 
  Settings, 
  Heart, 
  Eye, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  LogOut,
  Wallet,
  Receipt,
  Bell,
  Search,
  Filter,
  Download,
  Lock,
  AlertTriangle,
  Star
} from "lucide-react";

interface UserListing {
  id: number;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  category_name: string;
  images: string[];
  location: string;
  view_count: number;
  is_active: boolean;
  is_featured?: boolean;
  created_at: string;
}

interface UserFavorite {
  id: number;
  listing_id: number;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  images: string[];
  location: string;
  created_at: string;
}

interface Transaction {
  id: number;
  type: 'wallet_charge' | 'featured_ad' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  is_read: boolean;
  created_at: string;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Search & Filter
  const [listingSearch, setListingSearch] = useState('');
  const [listingFilter, setListingFilter] = useState('all');
  const [favoriteSearch, setFavoriteSearch] = useState('');
  
  // Edit Dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingListing, setEditingListing] = useState<UserListing | null>(null);
  
  // Settings
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [featureListing, setFeatureListing] = useState<UserListing | null>(null);
  const [featureDuration, setFeatureDuration] = useState<number>(7);
  const [featureCardInfo, setFeatureCardInfo] = useState<{ card_number: string; cardholder_name: string; bank_name: string; price_per_day: number; payment_window_min: number } | null>(null);
  const [featureTx, setFeatureTx] = useState<{ id: number; amount: number; deadline: string } | null>(null);
  const [featureProof, setFeatureProof] = useState<string>('');
  const [featureCountdown, setFeatureCountdown] = useState<number>(0);

  const loadUserData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user's listings - فقط آگهی‌های خود کاربر
      try {
        const listingsResponse = await apiService.getUserListings();
        if (listingsResponse.success && listingsResponse.data) {
          setListings(listingsResponse.data.listings || []);
        }
      } catch (error) {
        console.error('Error loading listings:', error);
        setListings([]);
      }

      // Load user's favorites
      try {
        const favoritesResponse = await apiService.getFavorites();
        if (favoritesResponse.success && favoritesResponse.data) {
          setFavorites(favoritesResponse.data.favorites || []);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      loadUserData();
    }
  }, [user, loadUserData]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await updateProfile({
        name: profileForm.name,
        email: profileForm.email,
      });
      
      if (result.success) {
        toast.success('پروفایل با موفقیت به‌روزرسانی شد');
      } else {
        toast.error(result.message || 'خطا در به‌روزرسانی پروفایل');
      }
    } catch (error) {
      toast.error('خطا در به‌روزرسانی پروفایل');
    }
  };

  const handleDeleteListing = async (id: number) => {
    if (!confirm('آیا از حذف این آگهی اطمینان دارید؟')) return;

    try {
      const response = await apiService.deleteListing(id);
      if (response.success) {
        setListings(prev => prev.filter(listing => listing.id !== id));
        toast.success('آگهی با موفقیت حذف شد');
        await loadUserData();
      } else {
        toast.error(response.message || 'خطا در حذف آگهی');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('خطا در حذف آگهی');
    }
  };

  const handleRemoveFavorite = async (listingId: number) => {
    try {
      const response = await apiService.removeFromFavorites(listingId);
      if (response.success) {
        setFavorites(prev => prev.filter(fav => fav.listing_id !== listingId));
        toast.success('از علاقه‌مندی‌ها حذف شد');
        await loadUserData();
      } else {
        toast.error(response.message || 'خطا در حذف از علاقه‌مندی‌ها');
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      toast.error('خطا در حذف از علاقه‌مندی‌ها');
    }
  };

  const openFeatureDialog = async (listing: UserListing) => {
    setFeatureListing(listing);
    setShowFeatureDialog(true);
    setFeatureDuration(7);
    setFeatureProof('');
    setFeatureTx(null);
    try {
      const info = await apiService.getCardToCardInfo();
      if (info.success && info.data) {
        setFeatureCardInfo(info.data as any);
      }
    } catch (e) {
      toast.error('خطا در دریافت اطلاعات کارت');
    }
  };

  const createFeatureTx = async () => {
    if (!featureListing) return;
    try {
      const resp = await apiService.createFeatureCardToCard(featureListing.id, featureDuration);
      if (resp.success && resp.data) {
        const d = resp.data as any;
        setFeatureTx({ id: d.transaction_id, amount: d.amount, deadline: d.deadline });
        const left = Math.max(0, Math.floor((new Date(d.deadline).getTime() - Date.now()) / 1000));
        setFeatureCountdown(left);
      } else {
        toast.error(resp.message || 'خطا در ایجاد تراکنش');
      }
    } catch (e) {
      toast.error('خطا در ایجاد تراکنش');
    }
  };

  const submitFeatureProof = async () => {
    if (!featureTx) {
      toast.error('ابتدا درخواست پرداخت را ایجاد کنید');
      return;
    }
    if (!featureProof || featureProof.trim().length < 10) {
      toast.error('توضیحات واریز خیلی کوتاه است');
      return;
    }
    try {
      const resp = await apiService.confirmFeatureCardToCard(featureTx.id, featureProof.trim());
      if (resp.success) {
        toast.success('درخواست شما برای پشتیبانی ثبت شد');
        setShowFeatureDialog(false);
        setFeatureListing(null);
        setFeatureTx(null);
        setFeatureProof('');
      } else {
        toast.error(resp.message || 'خطا در ثبت مستندات');
      }
    } catch (e) {
      toast.error('خطا در ثبت مستندات');
    }
  };

  useEffect(() => {
    if (!featureTx) return;
    const target = new Date(featureTx.deadline).getTime();
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setFeatureCountdown(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [featureTx]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">لطفاً وارد شوید</h1>
          <Button onClick={() => navigate('/auth')}>ورود</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">پنل کاربری</h1>
            <p className="text-muted-foreground">خوش آمدید، {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              <Eye className="w-4 h-4 ml-2" />
              بازگشت به سایت
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">پروفایل</TabsTrigger>
            <TabsTrigger value="listings">آگهی‌های من</TabsTrigger>
            <TabsTrigger value="featured">آگهی‌های ویژه</TabsTrigger>
            <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
            <TabsTrigger value="favorites">علاقه‌مندی‌ها</TabsTrigger>
            <TabsTrigger value="settings">تنظیمات</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 ml-2" />
                  اطلاعات شخصی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">نام</label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="نام شما"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">ایمیل</label>
                      <Input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="ایمیل شما"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">شماره تماس</label>
                    <Input
                      value={profileForm.phone}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      شماره تماس قابل تغییر نیست
                    </p>
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    <Settings className="w-4 h-4 ml-2" />
                    ذخیره تغییرات
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">آگهی‌های من</h2>
              <Button onClick={() => navigate('/post-ad')}>
                <Plus className="w-4 h-4 ml-2" />
                آگهی جدید
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">هنوز آگهی‌ای ثبت نکرده‌اید</p>
                  <Button onClick={() => navigate('/post-ad')}>
                    <Plus className="w-4 h-4 ml-2" />
                    ثبت اولین آگهی
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="group">
                    <CardHeader className="p-0">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                          <span className="text-gray-400">بدون تصویر</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold line-clamp-2">{listing.title}</h3>
                          <p className="text-sm text-muted-foreground">{listing.category_name}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {formatPrice(listing.price)}
                          </span>
                          <Badge variant={listing.is_active ? "default" : "secondary"}>
                            {listing.is_active ? "فعال" : "غیرفعال"}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 ml-1" />
                            {listing.view_count}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 ml-1" />
                            {formatDate(listing.created_at)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                navigate(`/${listing.type}/${listing.id}`);
                              } catch (error) {
                                console.error('Navigation error:', error);
                                toast.error('خطا در باز کردن آگهی');
                              }
                            }}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            مشاهده
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFeatureDialog(listing)}
                            className="flex-1"
                          >
                            <Wallet className="w-4 h-4 ml-1" />
                            ویژه کردن
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingListing(listing);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteListing(listing.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <h2 className="text-xl font-semibold">علاقه‌مندی‌ها</h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : favorites.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">هنوز آگهی‌ای به علاقه‌مندی‌ها اضافه نکرده‌اید</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => (
                  <Card key={favorite.id} className="group">
                    <CardHeader className="p-0">
                      {favorite.images && favorite.images.length > 0 ? (
                        <img
                          src={favorite.images[0]}
                          alt={favorite.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                          <span className="text-gray-400">بدون تصویر</span>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold line-clamp-2">{favorite.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {favorite.type === 'rent' ? 'اجاره' : 'فروش'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {formatPrice(favorite.price)}
                          </span>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 ml-1" />
                            {favorite.location}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                navigate(`/${favorite.type}/${favorite.listing_id}`);
                              } catch (error) {
                                console.error('Navigation error:', error);
                                toast.error('خطا در باز کردن آگهی');
                              }
                            }}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            مشاهده
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFavorite(favorite.listing_id)}
                          >
                            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <h2 className="text-xl font-semibold">تراکنش‌های مالی</h2>
            
            <Card>
              <CardContent className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">تراکنشی ثبت نشده است</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Featured Listings Tab */}
          <TabsContent value="featured" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  آگهی‌های ویژه من
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userListings.filter(l => l.is_featured).length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">هیچ آگهی ویژه‌ای ندارید</p>
                      <Button onClick={() => navigate('/make-featured')}>
                        <Plus className="w-4 h-4 ml-2" />
                        ویژه کردن آگهی
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userListings.filter(l => l.is_featured).map((listing) => (
                        <Card key={listing.id} className="border-2 border-yellow-400">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {listing.images && listing.images.length > 0 && (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  className="w-24 h-24 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-bold">{listing.title}</h3>
                                  <Badge className="bg-yellow-500">ویژه</Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {listing.price.toLocaleString('fa-IR')} تومان
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-4 h-4" />
                                    {listing.view_count}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(listing.created_at).toLocaleDateString('fa-IR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  تاریخچه پرداخت‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">تاریخچه پرداخت‌های شما در اینجا نمایش داده می‌شود</p>
                  <p className="text-sm text-gray-500">این بخش به زودی فعال خواهد شد</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات حساب کاربری</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div>
                    <h3 className="font-medium">شماره تماس</h3>
                    <p className="text-sm text-muted-foreground">
                      {user.phone}
                    </p>
                  </div>
                  <Badge variant="outline">تایید شده</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">سیستم ورود</h3>
                    <p className="text-sm text-muted-foreground">
                      ورود با رمز عبور 6 رقمی یا کد یکبار مصرف
                    </p>
                  </div>
                  <Badge>فعال</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">اعلان‌ها</h3>
                    <p className="text-sm text-muted-foreground">
                      دریافت اعلان برای آگهی‌ها و پیام‌ها
                    </p>
                  </div>
                  <Badge>فعال</Badge>
                </div>

                <div className="border-t pt-4 mt-6">
                  <h3 className="font-medium text-red-600 mb-4">منطقه خطر</h3>
                  
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <h3 className="font-medium text-red-700">خروج از حساب کاربری</h3>
                      <p className="text-sm text-red-600">
                        از تمام دستگاه‌ها خارج شوید
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (confirm('آیا از خروج از حساب کاربری اطمینان دارید؟')) {
                          logout();
                          navigate('/');
                        }
                      }}
                    >
                      <LogOut className="w-4 h-4 ml-2" />
                      خروج
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg mt-4">
                    <div>
                      <h3 className="font-medium">حذف حساب کاربری</h3>
                      <p className="text-sm text-muted-foreground">
                        برای حذف دائمی حساب با پشتیبانی تماس بگیرید
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      <Phone className="w-4 h-4 ml-2" />
                      تماس با پشتیبانی
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Listing Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ویرایش آگهی</DialogTitle>
            </DialogHeader>
            {editingListing && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">عنوان آگهی</label>
                  <Input
                    value={editingListing.title}
                    onChange={(e) => setEditingListing({ ...editingListing, title: e.target.value })}
                    placeholder="عنوان آگهی"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">قیمت (تومان)</label>
                  <Input
                    type="number"
                    value={editingListing.price}
                    onChange={(e) => setEditingListing({ ...editingListing, price: parseFloat(e.target.value) })}
                    placeholder="قیمت"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">موقعیت مکانی</label>
                  <Input
                    value={editingListing.location}
                    onChange={(e) => setEditingListing({ ...editingListing, location: e.target.value })}
                    placeholder="شهر، استان"
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    انصراف
                  </Button>
                  <Button onClick={async () => {
                    try {
                      const response = await apiService.updateListing(editingListing.id, {
                        title: editingListing.title,
                        price: editingListing.price,
                        location: editingListing.location,
                      });
                      
                      if (response.success) {
                        toast.success('آگهی با موفقیت ویرایش شد');
                        setShowEditDialog(false);
                        loadUserData();
                      } else {
                        toast.error(response.message || 'خطا در ویرایش آگهی');
                      }
                    } catch (error) {
                      toast.error('خطا در ویرایش آگهی');
                    }
                  }}>
                    ذخیره تغییرات
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ویژه کردن آگهی</DialogTitle>
            </DialogHeader>
            {featureListing && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{featureListing.title}</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span>شماره کارت</span>
                      <span className="font-mono">{featureCardInfo?.card_number || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>نام صاحب کارت</span>
                      <span>{featureCardInfo?.cardholder_name || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                      <span>بانک</span>
                      <span>{featureCardInfo?.bank_name || '—'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">مدت (روز)</label>
                      <Input type="number" min={1} max={90} value={featureDuration} onChange={(e) => setFeatureDuration(parseInt(e.target.value || '1'))} />
                    </div>
                    <div className="flex items-end justify-end text-right">
                      <div>
                        <div className="text-sm">هزینه هر روز</div>
                        <div className="font-semibold">{new Intl.NumberFormat('fa-IR').format(Math.round((featureCardInfo?.price_per_day || 0)))} تومان</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>مبلغ قابل پرداخت</span>
                    <span className="font-bold">{new Intl.NumberFormat('fa-IR').format(Math.round((featureCardInfo?.price_per_day || 0) * featureDuration))} تومان</span>
                  </div>
                  {!featureTx ? (
                    <div className="flex justify-end">
                      <Button onClick={createFeatureTx} className="">
                        ایجاد درخواست پرداخت
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>مهلت پرداخت</span>
                        <span className="font-bold">{featureCountdown} ثانیه</span>
                      </div>
                      <div>
                        <label className="text-sm">توضیحات واریز</label>
                        <Textarea value={featureProof} onChange={(e) => setFeatureProof(e.target.value)} placeholder="شماره پیگیری، زمان واریز و توضیحات..." />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowFeatureDialog(false)}>انصراف</Button>
                        <Button onClick={submitFeatureProof}>ارسال مستندات</Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserDashboard;
