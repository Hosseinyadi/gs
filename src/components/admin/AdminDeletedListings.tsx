import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, User, Calendar, Filter, RotateCcw, AlertTriangle } from "lucide-react";
import apiService from "@/services/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeletedListing {
  id: number;
  listing_id: number;
  title: string;
  description: string;
  price: number;
  type: string;
  category_name: string;
  images: string[];
  location: string;
  deleted_by: 'user' | 'admin';
  delete_reason: string;
  delete_reason_text: string;
  user_name: string;
  user_phone: string;
  admin_name?: string;
  original_created_at: string;
  deleted_at: string;
}

const DELETE_REASON_LABELS: Record<string, string> = {
  sold: 'فروخته شد',
  rented: 'اجاره داده شد',
  changed_mind: 'پشیمان شدم',
  not_interested: 'صرفه‌نظر کردم',
  successful_sale: 'فروش موفق',
  admin_removed: 'حذف توسط مدیر',
  violation: 'تخلف',
  other: 'سایر',
};

const AdminDeletedListings = () => {
  const [listings, setListings] = useState<DeletedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<DeletedListing | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDeletedListings();
  }, [filterBy, filterReason]);

  const loadDeletedListings = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterBy !== 'all') params.deleted_by = filterBy;
      if (filterReason !== 'all') params.reason = filterReason;

      const response = await (apiService as any).request(
        `/admin/deleted-listings?${new URLSearchParams(params).toString()}`
      );
      
      if (response.success && response.data) {
        setListings(response.data.listings || []);
      }
    } catch (error) {
      console.error('Error loading deleted listings:', error);
      toast.error('خطا در بارگذاری آگهی‌های حذف شده');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  // بازگرداندن آگهی
  const handleRestore = async () => {
    if (!selectedListing) return;
    
    setActionLoading(true);
    try {
      const response = await (apiService as any).request(
        `/admin/deleted-listings/${selectedListing.id}/restore`,
        { method: 'POST' }
      );
      
      if (response.success) {
        toast.success('آگهی با موفقیت بازگردانده شد');
        loadDeletedListings();
      } else {
        toast.error(response.message || 'خطا در بازگرداندن آگهی');
      }
    } catch (error) {
      console.error('Error restoring listing:', error);
      toast.error('خطا در بازگرداندن آگهی');
    } finally {
      setActionLoading(false);
      setRestoreDialogOpen(false);
      setSelectedListing(null);
    }
  };

  // حذف دائمی آگهی
  const handlePermanentDelete = async () => {
    if (!selectedListing) return;
    
    setActionLoading(true);
    try {
      const response = await (apiService as any).request(
        `/admin/deleted-listings/${selectedListing.id}/permanent`,
        { method: 'DELETE' }
      );
      
      if (response.success) {
        toast.success('آگهی به طور دائمی حذف شد');
        loadDeletedListings();
      } else {
        toast.error(response.message || 'خطا در حذف دائمی آگهی');
      }
    } catch (error) {
      console.error('Error permanently deleting listing:', error);
      toast.error('خطا در حذف دائمی آگهی');
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setSelectedListing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-red-500" />
          آگهی‌های حذف شده
        </h2>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {listings.length} آگهی
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">فیلتر:</span>
            </div>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="حذف شده توسط" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="user">کاربر</SelectItem>
                <SelectItem value="admin">مدیر</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterReason} onValueChange={setFilterReason}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="دلیل حذف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دلایل</SelectItem>
                <SelectItem value="sold">فروخته شد</SelectItem>
                <SelectItem value="rented">اجاره داده شد</SelectItem>
                <SelectItem value="changed_mind">پشیمان شدم</SelectItem>
                <SelectItem value="not_interested">صرفه‌نظر کردم</SelectItem>
                <SelectItem value="successful_sale">فروش موفق</SelectItem>
                <SelectItem value="admin_removed">حذف توسط مدیر</SelectItem>
                <SelectItem value="violation">تخلف</SelectItem>
                <SelectItem value="other">سایر</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={loadDeletedListings}>
              بروزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trash2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">هیچ آگهی حذف شده‌ای یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="border-red-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-24 h-24 object-cover rounded-lg opacity-60"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">بدون تصویر</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-600 line-through">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">{listing.category_name}</p>
                        <p className="text-sm font-medium text-gray-500">{formatPrice(listing.price)}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={listing.deleted_by === 'admin' ? 'destructive' : 'secondary'}>
                          {listing.deleted_by === 'admin' ? 'حذف توسط مدیر' : 'حذف توسط کاربر'}
                        </Badge>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          {DELETE_REASON_LABELS[listing.delete_reason] || listing.delete_reason}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{listing.user_name || listing.user_phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>ایجاد: {formatDate(listing.original_created_at)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <Trash2 className="w-4 h-4" />
                        <span>حذف: {formatDate(listing.deleted_at)}</span>
                      </div>
                      {listing.admin_name && (
                        <div className="text-muted-foreground">
                          مدیر: {listing.admin_name}
                        </div>
                      )}
                    </div>

                    {listing.delete_reason_text && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-muted-foreground">
                        <strong>توضیحات:</strong> {listing.delete_reason_text}
                      </div>
                    )}

                    {/* دکمه‌های عملیات */}
                    <div className="mt-4 flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => {
                          setSelectedListing(listing);
                          setRestoreDialogOpen(true);
                        }}
                      >
                        <RotateCcw className="w-4 h-4 ml-1" />
                        بازگرداندن
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setSelectedListing(listing);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 ml-1" />
                        حذف دائمی
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* دیالوگ تأیید بازگرداندن */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-green-600" />
              بازگرداندن آگهی
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید آگهی "{selectedListing?.title}" را بازگردانید؟
              <br />
              این آگهی دوباره در سایت نمایش داده خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'در حال بازگرداندن...' : 'بازگرداندن'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* دیالوگ تأیید حذف دائمی */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              حذف دائمی آگهی
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید آگهی "{selectedListing?.title}" را به طور دائمی حذف کنید؟
              <br />
              <strong className="text-red-600">این عمل غیرقابل بازگشت است!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'در حال حذف...' : 'حذف دائمی'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDeletedListings;
