import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  User,
  Tag,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MoreVertical,
  Download,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchFilters {
  query: string;
  status: string;
  category: string;
  province: string;
  dateFrom: string;
  dateTo: string;
  userId: string;
  priceMin: string;
  priceMax: string;
  isFeatured: string;
  sortBy: string;
  sortOrder: string;
}

interface Listing {
  id: number;
  title: string;
  price: number;
  status: string;
  category_name: string;
  province: string;
  city: string;
  user_name: string;
  user_phone: string;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  images: string[];
}

const PROVINCES = [
  'کل ایران', 'تهران', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی',
  'خوزستان', 'مازندران', 'کرمان', 'آذربایجان غربی', 'گیلان', 'سیستان و بلوچستان',
  'کرمانشاه', 'گلستان', 'هرمزگان', 'لرستان', 'همدان', 'کردستان', 'مرکزی',
  'قزوین', 'اردبیل', 'بوشهر', 'زنجان', 'قم', 'یزد', 'چهارمحال و بختیاری',
  'البرز', 'ایلام', 'کهگیلویه و بویراحمد', 'سمنان', 'خراسان شمالی', 'خراسان جنوبی'
];

const AdminListingsSearch = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: 'all',
    category: 'all',
    province: 'all',
    dateFrom: '',
    dateTo: '',
    userId: '',
    priceMin: '',
    priceMax: '',
    isFeatured: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${baseUrl}/categories`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  const searchListings = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      if (filters.query) params.append('query', filters.query);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.province !== 'all') params.append('province', filters.province);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.priceMin) params.append('priceMin', filters.priceMin);
      if (filters.priceMax) params.append('priceMax', filters.priceMax);
      if (filters.isFeatured !== 'all') params.append('isFeatured', filters.isFeatured);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`${baseUrl}/admin/listings/search?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (data.success) {
        setListings(data.data.listings || []);
        setTotalCount(data.data.total || 0);
      }
    } catch (error) {
      console.error('Error searching listings:', error);
      toast.error('خطا در جستجو');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    searchListings();
  }, [searchListings]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      status: 'all',
      category: 'all',
      province: 'all',
      dateFrom: '',
      dateTo: '',
      userId: '',
      priceMin: '',
      priceMax: '',
      isFeatured: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setPage(1);
  };

  const exportResults = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.province !== 'all') params.append('province', filters.province);

      const response = await fetch(`${baseUrl}/admin/listings/export?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `listings-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('فایل دانلود شد');
    } catch (error) {
      toast.error('خطا در خروجی گرفتن');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">فعال</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">در انتظار</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">رد شده</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700">منقضی</Badge>;
      case 'archived':
        return <Badge className="bg-purple-100 text-purple-700">بایگانی</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy' || key === 'sortOrder') return false;
    if (value === 'all' || value === '') return false;
    return true;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Search className="w-7 h-7 text-blue-500" />
            جستجوی پیشرفته آگهی‌ها
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {totalCount} آگهی یافت شد
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            فیلترها
            {activeFiltersCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">{activeFiltersCount}</Badge>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={exportResults} className="gap-2">
            <Download className="w-4 h-4" />
            خروجی
          </Button>

          <Button variant="outline" size="sm" onClick={searchListings} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="جستجو در عنوان، توضیحات، شماره تماس..."
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pr-10"
              />
            </div>
            <Button onClick={searchListings} disabled={loading}>
              <Search className="w-4 h-4 ml-2" />
              جستجو
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                فیلترهای پیشرفته
              </CardTitle>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500">
                  <X className="w-4 h-4 ml-1" />
                  پاک کردن فیلترها
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">وضعیت</label>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                    <SelectItem value="expired">منقضی</SelectItem>
                    <SelectItem value="archived">بایگانی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">دسته‌بندی</label>
                <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Province */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">استان</label>
                <Select value={filters.province} onValueChange={(v) => handleFilterChange('province', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Featured */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">نوع آگهی</label>
                <Select value={filters.isFeatured} onValueChange={(v) => handleFilterChange('isFeatured', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="true">ویژه</SelectItem>
                    <SelectItem value="false">عادی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">از تاریخ</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">تا تاریخ</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              {/* Price Min */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">حداقل قیمت</label>
                <Input
                  type="number"
                  placeholder="تومان"
                  value={filters.priceMin}
                  onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                />
              </div>

              {/* Price Max */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">حداکثر قیمت</label>
                <Input
                  type="number"
                  placeholder="تومان"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                />
              </div>

              {/* User ID */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">شناسه کاربر</label>
                <Input
                  type="text"
                  placeholder="شماره یا نام"
                  value={filters.userId}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">مرتب‌سازی</label>
                <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">تاریخ ثبت</SelectItem>
                    <SelectItem value="price">قیمت</SelectItem>
                    <SelectItem value="view_count">بازدید</SelectItem>
                    <SelectItem value="title">عنوان</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">ترتیب</label>
                <Select value={filters.sortOrder} onValueChange={(v) => handleFilterChange('sortOrder', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">نزولی</SelectItem>
                    <SelectItem value="asc">صعودی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">آگهی‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-right p-4 font-medium text-gray-600">آگهی</th>
                    <th className="text-right p-4 font-medium text-gray-600">دسته‌بندی</th>
                    <th className="text-right p-4 font-medium text-gray-600">قیمت</th>
                    <th className="text-right p-4 font-medium text-gray-600">مکان</th>
                    <th className="text-right p-4 font-medium text-gray-600">کاربر</th>
                    <th className="text-right p-4 font-medium text-gray-600">وضعیت</th>
                    <th className="text-right p-4 font-medium text-gray-600">بازدید</th>
                    <th className="text-right p-4 font-medium text-gray-600">تاریخ</th>
                    <th className="text-center p-4 font-medium text-gray-600">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {listings.map((listing) => (
                    <tr key={listing.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {listing.images?.[0] ? (
                              <img 
                                src={listing.images[0]} 
                                alt={listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileText className="w-6 h-6 text-gray-400 m-3" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                            <p className="text-xs text-gray-500">#{listing.id}</p>
                          </div>
                          {listing.is_featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{listing.category_name || '-'}</Badge>
                      </td>
                      <td className="p-4 font-medium">
                        {listing.price ? `${formatPrice(listing.price)} تومان` : 'توافقی'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {listing.province || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="font-medium">{listing.user_name || '-'}</p>
                          <p className="text-gray-500 text-xs">{listing.user_phone}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(listing.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Eye className="w-4 h-4" />
                          {formatPrice(listing.view_count || 0)}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDate(listing.created_at)}
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 ml-2" />
                              مشاهده
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="w-4 h-4 ml-2" />
                              تایید
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="w-4 h-4 ml-2" />
                              رد
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-600">
                نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, totalCount)} از {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-sm px-3">
                  صفحه {page} از {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminListingsSearch;
