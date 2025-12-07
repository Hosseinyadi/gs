import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import apiService from "@/services/api";
import {
  Home,
  Star,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface HomeFeaturedListing {
  id: number;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  category_name?: string;
  user_name?: string;
  user_phone?: string;
  location?: string;
  view_count?: number;
  is_home_featured?: boolean;
  home_featured_at?: string;
  created_at?: string;
}

function AdminHomeFeatured() {
  const [listings, setListings] = useState<HomeFeaturedListing[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHomeFeaturedListings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.request('/admin/home-featured');
      if (response.success && response.data) {
        // Sort by home_featured_at DESC (newest first)
        const sortedListings = (response.data.listings || []).sort(
          (a: HomeFeaturedListing, b: HomeFeaturedListing) => {
            const dateA = new Date(a.home_featured_at || a.created_at || 0).getTime();
            const dateB = new Date(b.home_featured_at || b.created_at || 0).getTime();
            return dateB - dateA;
          }
        );
        setListings(sortedListings);
      }
    } catch (error) {
      console.error('Error loading home featured listings:', error);
      toast.error('خطا در بارگذاری آگهی‌های ویژه صفحه اصلی');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeFeaturedListings();
  }, [loadHomeFeaturedListings]);

  const handleRemoveFromHomeFeatured = async (listing: HomeFeaturedListing) => {
    try {
      const toastId = toast.loading('در حال حذف از ویژه صفحه اصلی...');
      
      const response = await apiService.request(`/admin/listings/${listing.id}/toggle-home-featured`, {
        method: 'POST'
      });
      
      if (response.success) {
        setListings(prev => prev.filter(l => l.id !== listing.id));
        toast.dismiss(toastId);
        toast.success('آگهی از ویژه صفحه اصلی حذف شد');
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در حذف');
      }
    } catch (error) {
      console.error('Error removing from home featured:', error);
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Home className="w-6 h-6 text-orange-500" />
              آگهی‌های ویژه صفحه اصلی
            </CardTitle>
            <Button onClick={loadHomeFeaturedListings} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-2" />
              بروزرسانی
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <p className="text-orange-800 text-sm">
              <strong>راهنما:</strong> آگهی‌های ویژه صفحه اصلی در بخش ویژه صفحه اصلی نمایش داده می‌شوند.
              جدیدترین آگهی‌ها بالاتر نمایش داده می‌شوند.
              برای اضافه کردن آگهی جدید، از بخش "مدیریت آگهی‌ها" دکمه 🏠 را بزنید.
            </p>
          </div>
          
          <div className="text-sm text-gray-600">
            تعداد آگهی‌های ویژه صفحه اصلی: <strong>{listings.length}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">هیچ آگهی ویژه‌ای برای صفحه اصلی تعریف نشده</p>
              <p className="text-sm mt-2">
                از بخش "مدیریت آگهی‌ها" آگهی‌های مورد نظر را ویژه صفحه اصلی کنید
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing, index) => (
                <div 
                  key={listing.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {listing.title}
                        <Badge variant={listing.type === 'rent' ? 'secondary' : 'default'}>
                          {listing.type === 'rent' ? 'اجاره' : 'فروش'}
                        </Badge>
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="font-medium text-green-600">{formatPrice(listing.price)}</span>
                        {listing.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {listing.view_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(listing.home_featured_at || listing.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFromHomeFeatured(listing)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminHomeFeatured;
