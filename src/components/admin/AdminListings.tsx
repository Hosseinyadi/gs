import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import apiService from "@/services/api";
import adminApi from "@/services/admin-api";
import {
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Star,
  Search,
  Loader2,
  Calendar,
  MapPin,
  DollarSign,
  ExternalLink,
  Pencil
} from "lucide-react";

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

interface CategoryOption {
  id: number;
  name: string;
}

function AdminListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [featureDays, setFeatureDays] = useState('7');
  const [featurePlan, setFeaturePlan] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '',
    description: '',
    price: '',
    type: 'sale',
    location: '',
    is_active: true,
    category_id: 0
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await apiService.getAdminListings(params);
      if (response.success && response.data) {
        setListings(response.data.listings);
        setTotalPages(response.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      toast.error('خطا در بارگذاری آگهی‌ها');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getCategories();
        if (response.success && response.data?.categories) {
          setCategories(response.data.categories.map(cat => ({ id: cat.id, name: cat.name })));
        }
      } catch (error) {
        console.error('Error loading categories', error);
      }
    };

    loadCategories();
  }, []);

  const handleStatusChange = async (id: number, isActive: boolean) => {
    try {
      // نمایش وضعیت در حال بارگذاری
      const toastId = toast.loading('در حال به‌روزرسانی وضعیت آگهی...');
      
      const response = await apiService.updateListingStatus(id, { is_active: isActive });
      
      if (response.success) {
        // به‌روزرسانی وضعیت در حافظه
        setListings(prev =>
          prev.map(listing =>
            listing.id === id ? { ...listing, is_active: isActive } : listing
          )
        );
        toast.dismiss(toastId);
        toast.success(`آگهی با موفقیت ${isActive ? 'فعال' : 'غیرفعال'} شد`);
        
        // بارگذاری مجدد لیست برای اطمینان از به‌روز بودن داده‌ها
        await loadListings();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در تغییر وضعیت آگهی');
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این آگهی اطمینان دارید؟')) return;

    try {
      toast.loading('در حال حذف آگهی...');
      
      const response = await apiService.deleteAdminListing(id);
      
      if (response.success) {
        // حذف آگهی از لیست نمایشی
        setListings(prev => prev.filter(listing => listing.id !== id));
        toast.dismiss();
        toast.success('آگهی با موفقیت حذف شد');
        
        // بارگذاری مجدد لیست برای اطمینان از به‌روز بودن داده‌ها
        await loadListings();
      } else {
        toast.dismiss();
        toast.error(response.message || 'خطا در حذف آگهی');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleMakeFeatured = async () => {
    if (!selectedListing) return;

    try {
      const toastId = toast.loading('در حال ارتقا آگهی به ویژه...');
      
      const response = await adminApi.makeListingFeatured(
        selectedListing.id,
        parseInt(featureDays)
      );
      
      if (response.success) {
        // به‌روزرسانی وضعیت در حافظه
        setListings(prev =>
          prev.map(listing =>
            listing.id === selectedListing.id
              ? { ...listing, is_featured: true }
              : listing
          )
        );
        
        toast.dismiss(toastId);
        toast.success(`آگهی با موفقیت به مدت ${featureDays} روز ویژه شد`);
        
        // بارگذاری مجدد لیست برای اطمینان از به‌روز بودن داده‌ها
        await loadListings();
        setShowFeatureDialog(false);
        setSelectedListing(null);
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ارتقا به ویژه');
      }
    } catch (error) {
      console.error('Error making listing featured:', error);
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    }
  };

  const viewDetails = async (listing: Listing) => {
    setSelectedListing(listing);
    setShowDetailDialog(true);
    setDetailLoading(true);
    
    try {
      const toastId = toast.loading('در حال دریافت جزئیات آگهی...');
      const response = await apiService.getAdminListing(listing.id);
      
      if (response.success && response.data?.listing) {
        setSelectedListing(response.data.listing);
        toast.dismiss(toastId);
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در دریافت جزئیات آگهی');
      }
    } catch (error) {
      console.error('Error loading listing details', error);
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور. لطفاً مطمئن شوید سرور در حال اجراست و دوباره تلاش کنید.');
    } finally {
      setDetailLoading(false);
    }
  };

  const openListingOnSite = (listing: Listing) => {
    // استفاده از URL کامل به جای path نسبی
    const baseUrl = window.location.origin;
    const path = listing.type === 'rent' ? `/rent/${listing.id}` : `/sale/${listing.id}`;
    window.open(`${baseUrl}${path}`, '_blank');
  };

  const handleEdit = async (listing: Listing) => {
    try {
      // نمایش وضعیت در حال بارگذاری
      toast.loading('در حال دریافت اطلاعات آگهی...');
      
      // دریافت جزئیات کامل آگهی برای ویرایش
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
      console.error('Error fetching listing details for edit:', error);
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    }
  };

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingListing) return;

    const numericPrice = Number(editForm.price || 0);
    if (!numericPrice || Number.isNaN(numericPrice)) {
      toast.error('لطفاً قیمت معتبر وارد کنید');
      return;
    }

    if (!editForm.category_id) {
      toast.error('لطفاً دسته‌بندی را انتخاب کنید');
      return;
    }

    setEditLoading(true);
    const toastId = toast.loading('در حال ذخیره تغییرات...');
    
    try {
      const response = await apiService.updateAdminListing(editingListing.id, {
        title: editForm.title,
        description: editForm.description,
        price: numericPrice,
        type: editForm.type,
        location: editForm.location,
        category_id: editForm.category_id,
        is_active: editForm.is_active
      });

      if (response.success) {
        toast.dismiss(toastId);
        toast.success('آگهی با موفقیت ویرایش شد');
        setShowEditDialog(false);
        setEditingListing(null);
        await loadListings();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ذخیره تغییرات آگهی');
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setShowEditDialog(open);
    if (!open) {
      setEditingListing(null);
    }
  };

  const handleApproveListing = async (id: number) => {
    try {
      const toastId = toast.loading('در حال تایید آگهی...');
      
      const response = await apiService.request(`/admin/listings/${id}/approve`, {
        method: 'POST'
      });
      
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('آگهی تایید و منتشر شد');
        await loadListings();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در تایید آگهی');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.dismiss();
      toast.error('خطا در ارتباط با سرور');
    }
  };

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
        toast.success('آگهی رد شد و اطلاع‌رسانی به کاربر ارسال شد');
        setShowRejectDialog(false);
        setRejectReason('');
        setSelectedListing(null);
        await loadListings();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در رد آگهی');
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
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
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در آگهی‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="active">فعال</SelectItem>
                <SelectItem value="inactive">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="نوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="rent">اجاره</SelectItem>
                <SelectItem value="sale">فروش</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={loadListings} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 ml-2" />
              بروزرسانی
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست آگهی‌ها ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              آگهی‌ای یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4">عنوان</th>
                    <th className="text-right p-4">فروشنده</th>
                    <th className="text-right p-4">قیمت</th>
                    <th className="text-right p-4">بازدید</th>
                    <th className="text-right p-4">وضعیت</th>
                    <th className="text-right p-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {listing.title}
                            {listing.is_featured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {listing.category_name} • {listing.type === 'rent' ? 'اجاره' : 'فروش'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{listing.user_name}</p>
                          <p className="text-sm text-muted-foreground">{listing.user_phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{formatPrice(listing.price)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 ml-1" />
                          {listing.view_count || 0}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={listing.is_active ? "default" : "secondary"}>
                          {listing.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              viewDetails(listing);
                            }}
                            title="جزئیات سریع"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openListingOnSite(listing);
                            }}
                            title="مشاهده در سایت"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(listing);
                            }}
                            title="ویرایش آگهی"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleStatusChange(listing.id, !listing.is_active);
                            }}
                            title={listing.is_active ? "غیرفعال کردن" : "فعال کردن"}
                          >
                            {listing.is_active ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedListing(listing);
                              setShowFeatureDialog(true);
                            }}
                            title="ارتقا به ویژه"
                          >
                            <Star className="w-4 h-4 text-yellow-500" />
                          </Button>
                          {listing.approval_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleApproveListing(listing.id);
                                }}
                                title="تایید آگهی"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedListing(listing);
                                  setShowRejectDialog(true);
                                }}
                                title="رد آگهی"
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(listing.id);
                            }}
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات آگهی</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : selectedListing ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">{selectedListing.title}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge variant={selectedListing.is_active ? "default" : "secondary"}>
                    {selectedListing.is_active ? "فعال" : "غیرفعال"}
                  </Badge>
                  {selectedListing.is_featured && (
                    <Badge variant="default" className="bg-yellow-500">
                      <Star className="w-3 h-3 ml-1" />
                      ویژه
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="font-bold">{formatPrice(selectedListing.price)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedListing.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span>{selectedListing.view_count || 0} بازدید</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{formatDate(selectedListing.created_at)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">توضیحات:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">اطلاعات فروشنده:</h4>
                <p>نام: {selectedListing.user_name}</p>
                <p>تلفن: {selectedListing.user_phone}</p>
              </div>

              {selectedListing.images && Array.isArray(selectedListing.images) && selectedListing.images.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">تصاویر:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedListing.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`تصویر ${idx + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Feature Dialog */}
      <Dialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ارتقا به آگهی ویژه</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedListing && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium">{selectedListing.title}</p>
                <p className="text-sm text-gray-600">{formatPrice(selectedListing.price)}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">انتخاب پلن:</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={featurePlan === 'daily' ? 'default' : 'outline'}
                  onClick={() => {
                    setFeaturePlan('daily');
                    setFeatureDays('1');
                  }}
                  className="h-auto py-3 flex flex-col items-center"
                >
                  <Calendar className="w-5 h-5 mb-1" />
                  <span className="font-bold">روزانه</span>
                  <span className="text-xs">1 روز</span>
                </Button>
                
                <Button
                  type="button"
                  variant={featurePlan === 'weekly' ? 'default' : 'outline'}
                  onClick={() => {
                    setFeaturePlan('weekly');
                    setFeatureDays('7');
                  }}
                  className="h-auto py-3 flex flex-col items-center"
                >
                  <Calendar className="w-5 h-5 mb-1" />
                  <span className="font-bold">هفتگی</span>
                  <span className="text-xs">7 روز</span>
                </Button>
                
                <Button
                  type="button"
                  variant={featurePlan === 'monthly' ? 'default' : 'outline'}
                  onClick={() => {
                    setFeaturePlan('monthly');
                    setFeatureDays('30');
                  }}
                  className="h-auto py-3 flex flex-col items-center"
                >
                  <Calendar className="w-5 h-5 mb-1" />
                  <span className="font-bold">ماهیانه</span>
                  <span className="text-xs">30 روز</span>
                </Button>
                
                <Button
                  type="button"
                  variant={featurePlan === 'custom' ? 'default' : 'outline'}
                  onClick={() => setFeaturePlan('custom')}
                  className="h-auto py-3 flex flex-col items-center"
                >
                  <Calendar className="w-5 h-5 mb-1" />
                  <span className="font-bold">سفارشی</span>
                  <span className="text-xs">دلخواه</span>
                </Button>
              </div>
            </div>

            {featurePlan === 'custom' && (
              <div>
                <label className="text-sm font-medium">تعداد روز:</label>
                <Input
                  type="number"
                  value={featureDays}
                  onChange={(e) => setFeatureDays(e.target.value)}
                  min="1"
                  max="365"
                  placeholder="تعداد روز را وارد کنید"
                />
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">مدت زمان:</span>
                <span className="font-bold">{featureDays} روز</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">تاریخ انقضا:</span>
                <span className="text-sm">
                  {new Date(Date.now() + parseInt(featureDays) * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR')}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeatureDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleMakeFeatured} className="bg-yellow-500 hover:bg-yellow-600">
              <Star className="w-4 h-4 ml-2" />
              ارتقا به ویژه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رد آگهی</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedListing && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium">{selectedListing.title}</p>
                <p className="text-sm text-gray-600">{selectedListing.user_name}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">دلیل رد آگهی:</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="لطفاً دلیل رد آگهی را به طور واضح بنویسید..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              انصراف
            </Button>
            <Button 
              onClick={handleRejectListing}
              className="bg-red-500 hover:bg-red-600"
              disabled={!rejectReason.trim()}
            >
              <XCircle className="w-4 h-4 ml-2" />
              رد آگهی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={handleEditDialogChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>ویرایش آگهی</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">عنوان</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">قیمت (تومان)</label>
                <Input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  min={0}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">نوع آگهی</label>
                <Select
                  value={editForm.type}
                  onValueChange={(value: Listing['type']) => setEditForm({ ...editForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">فروش</SelectItem>
                    <SelectItem value="rent">اجاره</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">دسته‌بندی</label>
              <Select
                value={editForm.category_id ? editForm.category_id.toString() : ''}
                onValueChange={(value) => setEditForm({ ...editForm, category_id: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">موقعیت</label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="edit-is-active" className="text-sm font-medium cursor-pointer">
                آگهی فعال باشد
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleEditDialogChange(false)}>
                انصراف
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ذخیره
                  </>
                ) : (
                  'ذخیره تغییرات'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminListings;
