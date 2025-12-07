import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";
import apiService from "@/services/api";
import adminApi from "@/services/admin-api";
import {
  CheckCircle, XCircle, Eye, Trash2, RefreshCw, Star, Search, Loader2,
  Calendar, MapPin, DollarSign, ExternalLink, Pencil, Home, Archive,
  Clock, FileText, AlertCircle, CheckSquare, Square
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  type: 'rent' | 'sale';
  category_id?: number;
  category_name?: string;
  user_name?: string;
  user_phone?: string;
  images?: string[];
  location: string;
  view_count?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_home_featured?: boolean;
  approval_status?: string;
  is_archived?: boolean;
  created_at?: string;
}

interface EditFormState {
  title: string;
  description: string;
  price: string;
  type: Listing['type'];
  location: string;
  is_active: boolean;
  category_id: number;
}

interface CategoryOption { id: number; name: string; }

interface DeletedListing {
  id: number;
  listing_id: number;
  title: string;
  description: string;
  price: number;
  type: string;
  category_name?: string;
  images?: string[];
  location: string;
  deleted_by: 'user' | 'admin';
  delete_reason: string;
  delete_reason_text?: string;
  user_name?: string;
  user_phone?: string;
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

function AdminListings() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'archived' | 'deleted'>('pending');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low' | 'views'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [featureDays, setFeatureDays] = useState('7');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '', description: '', price: '', type: 'sale', location: '', is_active: true, category_id: 0
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, archived: 0, deleted: 0 });
  const [deletedListings, setDeletedListings] = useState<DeletedListing[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, limit: 20 };
      if (searchQuery) params.search = searchQuery;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      // فیلتر بر اساس تب فعال
      if (activeTab === 'pending') {
        params.approval_status = 'pending';
      } else if (activeTab === 'approved') {
        params.approval_status = 'approved';
        params.is_archived = false;
      } else if (activeTab === 'archived') {
        params.is_archived = true;
      }

      const response = await apiService.getAdminListings(params);
      if (response.success && response.data) {
        setListings(response.data.listings);
        setTotalPages(response.data.pagination?.total_pages || 1);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('خطا در بارگذاری آگهی‌ها');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, activeTab]);

  const loadStats = useCallback(async () => {
    try {
      const response = await apiService.request('/admin/listings/stats');
      if (response.success && response.data) {
        const data = response.data as { pending?: number; approved?: number; archived?: number; deleted?: number };
        setStats({
          pending: data.pending || 0,
          approved: data.approved || 0,
          archived: data.archived || 0,
          deleted: data.deleted || 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // بارگذاری آگهی‌های حذف شده
  const loadDeletedListings = useCallback(async () => {
    setDeletedLoading(true);
    try {
      const response = await apiService.request('/admin/deleted-listings');
      if (response.success && response.data) {
        setDeletedListings((response.data as any).listings || []);
      }
    } catch (error) {
      console.error('Error loading deleted listings:', error);
    } finally {
      setDeletedLoading(false);
    }
  }, []);

  useEffect(() => { loadListings(); loadStats(); loadDeletedListings(); }, [loadListings, loadStats, loadDeletedListings]);
  useEffect(() => { setCurrentPage(1); setSelectedIds([]); if (activeTab === 'deleted') loadDeletedListings(); }, [activeTab]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getCategories();
        if (response.success && response.data?.categories) {
          setCategories(response.data.categories.map(cat => ({ id: cat.id, name: cat.name })));
        }
      } catch (error) { console.error('Error loading categories', error); }
    };
    loadCategories();
  }, []);

  // تایید آگهی
  const handleApproveListing = async (id: number) => {
    try {
      const toastId = toast.loading('در حال تایید آگهی...');
      const response = await apiService.request(`/admin/listings/${id}/approve`, { method: 'POST' });
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('آگهی تایید و منتشر شد');
        await loadListings();
        await loadStats();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در تایید آگهی');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // رد آگهی
  const handleRejectListing = async () => {
    if (!selectedListing || !rejectReason.trim()) {
      toast.error('دلیل رد آگهی الزامی است');
      return;
    }
    try {
      const toastId = toast.loading('در حال رد آگهی...');
      const response = await apiService.request(`/admin/listings/${selectedListing.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason })
      });
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('آگهی رد شد');
        setShowRejectDialog(false);
        setRejectReason('');
        setSelectedListing(null);
        await loadListings();
        await loadStats();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در رد آگهی');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // انتقال به بایگانی
  const handleArchiveListing = async (id: number) => {
    try {
      const toastId = toast.loading('در حال انتقال به بایگانی...');
      const response = await apiService.request(`/admin/listings/${id}/archive`, { method: 'POST' });
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('آگهی به بایگانی منتقل شد');
        await loadListings();
        await loadStats();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در انتقال به بایگانی');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // بازگرداندن از بایگانی
  const handleUnarchiveListing = async (id: number) => {
    try {
      const toastId = toast.loading('در حال بازگرداندن از بایگانی...');
      const response = await apiService.request(`/admin/listings/${id}/unarchive`, { method: 'POST' });
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('آگهی از بایگانی بازگردانده شد');
        await loadListings();
        await loadStats();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // حذف آگهی (انتقال به حذف شده‌ها)
  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این آگهی اطمینان دارید؟ آگهی به بخش حذف شده‌ها منتقل می‌شود.')) return;
    try {
      toast.loading('در حال حذف آگهی...');
      const response = await apiService.deleteAdminListing(id);
      if (response.success) {
        toast.dismiss();
        toast.success('آگهی به بخش حذف شده‌ها منتقل شد');
        await loadListings();
        await loadStats();
        await loadDeletedListings();
      } else {
        toast.dismiss();
        toast.error(response.message || 'خطا در حذف آگهی');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // بازگرداندن آگهی حذف شده
  const handleRestoreDeleted = async (id: number) => {
    if (!confirm('آیا می‌خواهید این آگهی را بازگردانید؟')) return;
    try {
      toast.loading('در حال بازگرداندن آگهی...');
      const response = await apiService.request(`/admin/deleted-listings/${id}/restore`, { method: 'POST' });
      if (response.success) {
        toast.dismiss();
        toast.success('آگهی با موفقیت بازگردانده شد');
        await loadDeletedListings();
        await loadStats();
      } else {
        toast.dismiss();
        toast.error((response as any).message || 'خطا در بازگرداندن آگهی');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // حذف دائمی آگهی
  const handlePermanentDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید؟ این عمل غیرقابل بازگشت است!')) return;
    try {
      toast.loading('در حال حذف دائمی...');
      const response = await apiService.request(`/admin/deleted-listings/${id}/permanent`, { method: 'DELETE' });
      if (response.success) {
        toast.dismiss();
        toast.success('آگهی به طور دائمی حذف شد');
        await loadDeletedListings();
        await loadStats();
      } else {
        toast.dismiss();
        toast.error((response as any).message || 'خطا در حذف دائمی');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // انتخاب/عدم انتخاب آگهی
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // انتخاب همه
  const selectAll = () => {
    if (selectedIds.length === listings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map(l => l.id));
    }
  };

  // تایید دسته‌جمعی
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`آیا از تایید ${selectedIds.length} آگهی اطمینان دارید؟`)) return;
    
    setBulkLoading(true);
    const toastId = toast.loading(`در حال تایید ${selectedIds.length} آگهی...`);
    
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const response = await apiService.request(`/admin/listings/${id}/approve`, { method: 'POST' });
        if (response.success) successCount++;
      }
      toast.dismiss(toastId);
      toast.success(`${successCount} آگهی با موفقیت تایید شد`);
      setSelectedIds([]);
      await loadListings();
      await loadStats();
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('خطا در تایید دسته‌جمعی');
    } finally {
      setBulkLoading(false);
    }
  };

  // بایگانی دسته‌جمعی
  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`آیا از بایگانی ${selectedIds.length} آگهی اطمینان دارید؟`)) return;
    
    setBulkLoading(true);
    const toastId = toast.loading(`در حال بایگانی ${selectedIds.length} آگهی...`);
    
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const response = await apiService.request(`/admin/listings/${id}/archive`, { method: 'POST' });
        if (response.success) successCount++;
      }
      toast.dismiss(toastId);
      toast.success(`${successCount} آگهی به بایگانی منتقل شد`);
      setSelectedIds([]);
      await loadListings();
      await loadStats();
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('خطا در بایگانی دسته‌جمعی');
    } finally {
      setBulkLoading(false);
    }
  };

  // مرتب‌سازی لیست
  const sortedListings = [...listings].sort((a, b) => {
    switch (sortBy) {
      case 'oldest': return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case 'price_high': return b.price - a.price;
      case 'price_low': return a.price - b.price;
      case 'views': return (b.view_count || 0) - (a.view_count || 0);
      default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  });

  // ویژه کردن
  const handleMakeFeatured = async () => {
    if (!selectedListing) return;
    try {
      const toastId = toast.loading('در حال ارتقا آگهی به ویژه...');
      const response = await adminApi.makeListingFeatured(selectedListing.id, parseInt(featureDays));
      if (response.success) {
        toast.dismiss(toastId);
        toast.success(`آگهی با موفقیت به مدت ${featureDays} روز ویژه شد`);
        await loadListings();
        setShowFeatureDialog(false);
        setSelectedListing(null);
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ارتقا به ویژه');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // ویژه صفحه اصلی
  const handleToggleHomeFeatured = async (listing: Listing) => {
    try {
      const toastId = toast.loading(listing.is_home_featured ? 'در حال حذف از ویژه صفحه اصلی...' : 'در حال اضافه به ویژه صفحه اصلی...');
      const response = await apiService.request(`/admin/listings/${listing.id}/toggle-home-featured`, { method: 'POST' });
      if (response.success) {
        setListings(prev => prev.map(l => l.id === listing.id ? { ...l, is_home_featured: !l.is_home_featured } : l));
        toast.dismiss(toastId);
        const resData = response.data as { is_home_featured?: boolean } | undefined;
        toast.success(resData?.is_home_featured ? 'آگهی به ویژه صفحه اصلی اضافه شد' : 'آگهی از ویژه صفحه اصلی حذف شد');
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در تغییر وضعیت');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  // مشاهده جزئیات
  const viewDetails = async (listing: Listing) => {
    setSelectedListing(listing);
    setShowDetailDialog(true);
    setDetailLoading(true);
    try {
      const response = await apiService.getAdminListing(listing.id);
      if (response.success && response.data?.listing) {
        setSelectedListing(response.data.listing);
      }
    } catch (error) {
      toast.error('خطا در دریافت جزئیات');
    } finally {
      setDetailLoading(false);
    }
  };

  // باز کردن در سایت
  const openListingOnSite = (listing: Listing) => {
    const baseUrl = window.location.origin;
    const path = listing.type === 'rent' ? `/rent/${listing.id}` : `/sale/${listing.id}`;
    window.open(`${baseUrl}${path}`, '_blank');
  };

  // ویرایش
  const handleEdit = async (listing: Listing) => {
    try {
      toast.loading('در حال دریافت اطلاعات آگهی...');
      const response = await apiService.getAdminListing(listing.id);
      if (response.success && response.data?.listing) {
        const fullListing = response.data.listing;
        setEditingListing(fullListing);
        setEditForm({
          title: fullListing.title || '',
          description: fullListing.description || '',
          price: fullListing.price ? fullListing.price.toString() : '',
          type: fullListing.type || 'sale',
          location: fullListing.location || '',
          is_active: fullListing.is_active ?? true,
          category_id: fullListing.category_id || 0
        });
        toast.dismiss();
        setShowEditDialog(true);
      } else {
        toast.dismiss();
        toast.error('خطا در دریافت اطلاعات آگهی');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingListing) return;
    const numericPrice = Number(editForm.price || 0);
    if (!numericPrice || Number.isNaN(numericPrice)) { toast.error('لطفاً قیمت معتبر وارد کنید'); return; }
    if (!editForm.category_id) { toast.error('لطفاً دسته‌بندی را انتخاب کنید'); return; }

    setEditLoading(true);
    const toastId = toast.loading('در حال ذخیره تغییرات...');
    try {
      const response = await apiService.updateAdminListing(editingListing.id, {
        title: editForm.title, description: editForm.description, price: numericPrice,
        type: editForm.type, location: editForm.location, category_id: editForm.category_id, is_active: editForm.is_active
      });
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('آگهی با موفقیت ویرایش شد');
        setShowEditDialog(false);
        setEditingListing(null);
        await loadListings();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ذخیره تغییرات');
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setEditLoading(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('fa-IR') : '-';

  // محاسبه زمان گذشته
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    if (diffDays < 7) return `${diffDays} روز پیش`;
    return formatDate(dateString);
  };

  // رندر کارت آگهی
  const renderListingCard = (listing: Listing) => (
    <Card key={listing.id} className={`hover:shadow-md transition-shadow border-r-4 ${selectedIds.includes(listing.id) ? 'border-r-blue-500 bg-blue-50/50' : 'border-r-transparent'}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* چک‌باکس انتخاب */}
          <div className="flex items-start pt-2">
            <Checkbox 
              checked={selectedIds.includes(listing.id)} 
              onCheckedChange={() => toggleSelect(listing.id)}
              className="w-5 h-5"
            />
          </div>
          
          {/* تصویر */}
          <div className="w-28 h-28 flex-shrink-0 relative">
            {listing.images && listing.images.length > 0 ? (
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {/* شماره آگهی */}
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              #{listing.id}
            </span>
          </div>
          
          {/* اطلاعات */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                  {listing.title}
                  {listing.is_featured && <span title="ویژه"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /></span>}
                  {listing.is_home_featured && <span title="ویژه صفحه اصلی"><Home className="w-4 h-4 text-orange-500 fill-orange-200" /></span>}
                </h3>
                <p className="text-sm text-gray-500">{listing.category_name}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={listing.type === 'rent' ? 'secondary' : 'default'}>
                  {listing.type === 'rent' ? 'اجاره' : 'فروش'}
                </Badge>
                <span className="text-xs text-gray-400">{getTimeAgo(listing.created_at)}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1 font-semibold text-green-600">
                <DollarSign className="w-4 h-4" />
                {formatPrice(listing.price)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {listing.location}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {listing.view_count || 0} بازدید
              </span>
            </div>
            
            <div className="mt-2 text-sm flex items-center gap-2">
              <span className="text-gray-500">فروشنده:</span>
              <span className="font-medium">{listing.user_name}</span>
              <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded">{listing.user_phone}</span>
            </div>
          </div>
        </div>
        
        {/* دکمه‌ها - راستچین */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t justify-end">
          {/* دکمه‌های اصلی عملیات - سمت راست */}
          {activeTab === 'pending' && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveListing(listing.id)}>
                <CheckCircle className="w-4 h-4 ml-1" /> تایید
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { setSelectedListing(listing); setShowRejectDialog(true); }}>
                <XCircle className="w-4 h-4 ml-1" /> رد
              </Button>
            </>
          )}
          
          {activeTab === 'archived' && (
            <>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApproveListing(listing.id)}>
                <CheckCircle className="w-4 h-4 ml-1" /> تایید
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleUnarchiveListing(listing.id)}>
                <RefreshCw className="w-4 h-4 ml-1" /> بازگردانی
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { setSelectedListing(listing); setShowRejectDialog(true); }}>
                <XCircle className="w-4 h-4 ml-1" /> رد
              </Button>
            </>
          )}

          {/* دکمه رد برای تب تایید شده */}
          {activeTab === 'approved' && (
            <Button size="sm" variant="destructive" onClick={() => { setSelectedListing(listing); setShowRejectDialog(true); }}>
              <XCircle className="w-4 h-4 ml-1" /> رد
            </Button>
          )}

          {/* دکمه‌های ویژه */}
          <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-600 hover:bg-yellow-50" onClick={() => { setSelectedListing(listing); setShowFeatureDialog(true); }}>
            <Star className="w-4 h-4 ml-1" /> ویژه
          </Button>
          <Button size="sm" variant={listing.is_home_featured ? "default" : "outline"} 
            className={listing.is_home_featured ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-orange-400 text-orange-600 hover:bg-orange-50"}
            onClick={() => handleToggleHomeFeatured(listing)}>
            <Home className="w-4 h-4 ml-1" />
            {listing.is_home_featured ? 'حذف از اصلی' : 'ویژه اصلی'}
          </Button>

          {/* دکمه‌های عمومی */}
          <Button size="sm" variant="outline" onClick={() => viewDetails(listing)} title="جزئیات">
            <Eye className="w-4 h-4 ml-1" /> جزئیات
          </Button>
          <Button size="sm" variant="outline" onClick={() => openListingOnSite(listing)} title="مشاهده در سایت">
            <ExternalLink className="w-4 h-4 ml-1" /> سایت
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleEdit(listing)} title="ویرایش">
            <Pencil className="w-4 h-4 ml-1" /> ویرایش
          </Button>
          
          {activeTab !== 'archived' && (
            <Button size="sm" variant="outline" onClick={() => handleArchiveListing(listing.id)} title="بایگانی">
              <Archive className="w-4 h-4 ml-1" /> بایگانی
            </Button>
          )}
          
          {/* دکمه حذف - انتقال به بخش حذف شده‌ها */}
          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(listing.id)}>
            <Trash2 className="w-4 h-4 ml-1" /> حذف
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* آمار */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={`cursor-pointer transition-all ${activeTab === 'pending' ? 'ring-2 ring-yellow-500' : ''}`} onClick={() => setActiveTab('pending')}>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">در انتظار تایید</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === 'approved' ? 'ring-2 ring-green-500' : ''}`} onClick={() => setActiveTab('approved')}>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-500">تایید شده</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === 'archived' ? 'ring-2 ring-gray-500' : ''}`} onClick={() => setActiveTab('archived')}>
          <CardContent className="p-4 text-center">
            <Archive className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            <div className="text-sm text-gray-500">بایگانی</div>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer transition-all ${activeTab === 'deleted' ? 'ring-2 ring-red-500' : ''}`} onClick={() => setActiveTab('deleted')}>
          <CardContent className="p-4 text-center">
            <Trash2 className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-red-600">{stats.deleted}</div>
            <div className="text-sm text-gray-500">حذف شده</div>
          </CardContent>
        </Card>
      </div>

      {/* تب‌ها */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            در انتظار تایید
            {stats.pending > 0 && <Badge variant="destructive" className="mr-1">{stats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            تایید شده
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="w-4 h-4" />
            بایگانی
          </TabsTrigger>
          <TabsTrigger value="deleted" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            حذف شده
            {stats.deleted > 0 && <Badge variant="destructive" className="mr-1">{stats.deleted}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* فیلترها */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input placeholder="جستجو در آگهی‌ها..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="نوع آگهی" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="rent">اجاره</SelectItem>
                  <SelectItem value="sale">فروش</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger><SelectValue placeholder="مرتب‌سازی" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">جدیدترین</SelectItem>
                  <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
                  <SelectItem value="price_high">گران‌ترین</SelectItem>
                  <SelectItem value="price_low">ارزان‌ترین</SelectItem>
                  <SelectItem value="views">پربازدیدترین</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* دکمه‌های عملیات دسته‌جمعی */}
            <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={selectAll} className="gap-2">
                  {selectedIds.length === listings.length && listings.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectedIds.length > 0 ? `${selectedIds.length} انتخاب شده` : 'انتخاب همه'}
                </Button>
                
                {selectedIds.length > 0 && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleBulkApprove} disabled={bulkLoading}>
                      <CheckCircle className="w-4 h-4 ml-1" /> تایید همه
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleBulkArchive} disabled={bulkLoading}>
                      <Archive className="w-4 h-4 ml-1" /> بایگانی همه
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                      لغو انتخاب
                    </Button>
                  </>
                )}
              </div>
              
              <Button onClick={() => { loadListings(); loadStats(); setSelectedIds([]); }} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 ml-2" /> بروزرسانی
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* محتوای تب‌ها */}
        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : sortedListings.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              هیچ آگهی در انتظار تایید نیست
            </CardContent></Card>
          ) : (
            <div className="space-y-4">{sortedListings.map(renderListingCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : sortedListings.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              هیچ آگهی تایید شده‌ای نیست
            </CardContent></Card>
          ) : (
            <div className="space-y-4">{sortedListings.map(renderListingCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : sortedListings.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-gray-500">
              <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              بایگانی خالی است
            </CardContent></Card>
          ) : (
            <div className="space-y-4">{sortedListings.map(renderListingCard)}</div>
          )}
        </TabsContent>

        {/* تب حذف شده‌ها */}
        <TabsContent value="deleted" className="mt-4">
          {deletedLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : deletedListings.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-gray-500">
              <Trash2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              هیچ آگهی حذف شده‌ای نیست
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {deletedListings.map((listing) => (
                <Card key={listing.id} className="border-red-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* تصویر */}
                      <div className="w-24 h-24 flex-shrink-0">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover rounded-lg opacity-60" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* اطلاعات */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-600 line-through">{listing.title}</h3>
                            <p className="text-sm text-gray-500">{listing.category_name}</p>
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

                        <div className="mt-2 text-sm text-gray-500">
                          <span>کاربر: {listing.user_name || listing.user_phone}</span>
                          <span className="mx-2">|</span>
                          <span>حذف: {new Date(listing.deleted_at).toLocaleDateString('fa-IR')}</span>
                        </div>

                        {listing.delete_reason_text && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>توضیحات:</strong> {listing.delete_reason_text}
                          </div>
                        )}

                        {/* دکمه‌ها */}
                        <div className="mt-4 flex gap-2 justify-end">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleRestoreDeleted(listing.id)}
                          >
                            <RefreshCw className="w-4 h-4 ml-1" />
                            بازگرداندن
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handlePermanentDelete(listing.id)}
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
        </TabsContent>
      </Tabs>

      {/* صفحه‌بندی */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>قبلی</Button>
          <span className="px-4 py-2">صفحه {currentPage} از {totalPages}</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>بعدی</Button>
        </div>
      )}

      {/* دیالوگ جزئیات */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>جزئیات آگهی</DialogTitle></DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : selectedListing ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">{selectedListing.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant={selectedListing.is_active ? "default" : "secondary"}>{selectedListing.is_active ? "فعال" : "غیرفعال"}</Badge>
                  {selectedListing.is_featured && <Badge className="bg-yellow-500"><Star className="w-3 h-3 ml-1" />ویژه</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-gray-500" /><span className="font-bold">{formatPrice(selectedListing.price)}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /><span>{selectedListing.location}</span></div>
                <div className="flex items-center gap-2"><Eye className="w-4 h-4 text-gray-500" /><span>{selectedListing.view_count || 0} بازدید</span></div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-500" /><span>{formatDate(selectedListing.created_at)}</span></div>
              </div>
              <div><h4 className="font-semibold mb-2">توضیحات:</h4><p className="text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p></div>
              <div><h4 className="font-semibold mb-2">اطلاعات فروشنده:</h4><p>نام: {selectedListing.user_name}</p><p>تلفن: {selectedListing.user_phone}</p></div>
              {selectedListing.images && Array.isArray(selectedListing.images) && selectedListing.images.length > 0 && (
                <div><h4 className="font-semibold mb-2">تصاویر:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedListing.images.map((img, idx) => (<img key={idx} src={img} alt={`تصویر ${idx + 1}`} className="w-full h-32 object-cover rounded" />))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* دیالوگ رد آگهی */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>رد آگهی</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">لطفاً دلیل رد آگهی را وارد کنید:</p>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="دلیل رد آگهی..." rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>انصراف</Button>
            <Button variant="destructive" onClick={handleRejectListing}>رد آگهی</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ ویژه کردن */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>ارتقا به آگهی ویژه</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedListing && <div className="bg-blue-50 p-3 rounded-lg"><p className="font-medium">{selectedListing.title}</p><p className="text-sm text-gray-600">{formatPrice(selectedListing.price)}</p></div>}
            <div>
              <label className="text-sm font-medium">مدت زمان (روز)</label>
              <Select value={featureDays} onValueChange={setFeatureDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">۱ روز</SelectItem>
                  <SelectItem value="3">۳ روز</SelectItem>
                  <SelectItem value="7">۷ روز</SelectItem>
                  <SelectItem value="14">۱۴ روز</SelectItem>
                  <SelectItem value="30">۳۰ روز</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeatureDialog(false)}>انصراف</Button>
            <Button onClick={handleMakeFeatured} className="bg-yellow-500 hover:bg-yellow-600"><Star className="w-4 h-4 ml-2" />ویژه کردن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* دیالوگ ویرایش */}
      <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) setEditingListing(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>ویرایش آگهی</DialogTitle></DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div><label className="text-sm font-medium">عنوان</label><Input value={editForm.title} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} required /></div>
            <div><label className="text-sm font-medium">توضیحات</label><Textarea value={editForm.description} onChange={(e) => setEditForm(p => ({ ...p, description: e.target.value }))} rows={4} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">قیمت (تومان)</label><Input type="number" value={editForm.price} onChange={(e) => setEditForm(p => ({ ...p, price: e.target.value }))} required /></div>
              <div><label className="text-sm font-medium">نوع</label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm(p => ({ ...p, type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="sale">فروش</SelectItem><SelectItem value="rent">اجاره</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">موقعیت</label><Input value={editForm.location} onChange={(e) => setEditForm(p => ({ ...p, location: e.target.value }))} /></div>
            <div><label className="text-sm font-medium">دسته‌بندی</label>
              <Select value={editForm.category_id.toString()} onValueChange={(v) => setEditForm(p => ({ ...p, category_id: parseInt(v) }))}>
                <SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger>
                <SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>انصراف</Button>
              <Button type="submit" disabled={editLoading}>{editLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}ذخیره تغییرات</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminListings;
