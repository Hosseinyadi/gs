import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Download,
  FileSpreadsheet,
  Calendar
} from "lucide-react";

// لیست کامل استان‌های ایران (31 استان + کل ایران)
const PROVINCES = [
  'کل ایران',
  'تهران',
  'خوزستان',
  'بوشهر',
  'اصفهان',
  'خراسان رضوی',
  'فارس',
  'آذربایجان شرقی',
  'مازندران',
  'کرمان',
  'البرز',
  'گیلان',
  'کهگیلویه و بویراحمد',
  'آذربایجان غربی',
  'هرمزگان',
  'مرکزی',
  'یزد',
  'کرمانشاه',
  'قزوین',
  'سیستان و بلوچستان',
  'همدان',
  'ایلام',
  'گلستان',
  'لرستان',
  'زنجان',
  'اردبیل',
  'قم',
  'کردستان',
  'سمنان',
  'چهارمحال و بختیاری',
  'خراسان شمالی',
  'خراسان جنوبی'
];

interface FilterValues {
  search: string;
  status: string;
  type: string;
  province: string;
  minPrice: string;
  maxPrice: string;
  dateFrom: string;
  dateTo: string;
  category: string;
  featured: string;
}

interface AdminAdvancedFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  onExport: (format: 'csv' | 'excel') => void;
  categories: { id: number; name: string }[];
  totalCount: number;
}

function AdminAdvancedFilters({ onFilterChange, onExport, categories, totalCount }: AdminAdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    status: 'all',
    type: 'all',
    province: 'all',
    minPrice: '',
    maxPrice: '',
    dateFrom: '',
    dateTo: '',
    category: 'all',
    featured: 'all'
  });

  const handleFilterChange = (key: keyof FilterValues, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterValues = {
      search: '',
      status: 'all',
      type: 'all',
      province: 'all',
      minPrice: '',
      maxPrice: '',
      dateFrom: '',
      dateTo: '',
      category: 'all',
      featured: 'all'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== 'all' && value !== ''
  ).length;

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                <Filter className="w-5 h-5" />
                <CardTitle className="text-lg">فیلتر پیشرفته</CardTitle>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {totalCount.toLocaleString('fa-IR')} آگهی
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('excel')}
                className="flex items-center gap-1"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* جستجو */}
              <div className="space-y-2">
                <Label>جستجو</Label>
                <Input
                  placeholder="عنوان، توضیحات، نام کاربر..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* وضعیت */}
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                    <SelectItem value="pending">در انتظار تایید</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* نوع */}
              <div className="space-y-2">
                <Label>نوع آگهی</Label>
                <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="sale">فروش</SelectItem>
                    <SelectItem value="rent">اجاره</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* استان */}
              <div className="space-y-2">
                <Label>استان</Label>
                <Select value={filters.province} onValueChange={(v) => handleFilterChange('province', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه استان‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه استان‌ها</SelectItem>
                    {PROVINCES.map(province => (
                      <SelectItem key={province} value={province}>{province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* دسته‌بندی */}
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه دسته‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دسته‌ها</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ویژه */}
              <div className="space-y-2">
                <Label>وضعیت ویژه</Label>
                <Select value={filters.featured} onValueChange={(v) => handleFilterChange('featured', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="featured">ویژه</SelectItem>
                    <SelectItem value="home_featured">ویژه صفحه اصلی</SelectItem>
                    <SelectItem value="normal">عادی</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* حداقل قیمت */}
              <div className="space-y-2">
                <Label>حداقل قیمت (تومان)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
              </div>

              {/* حداکثر قیمت */}
              <div className="space-y-2">
                <Label>حداکثر قیمت (تومان)</Label>
                <Input
                  type="number"
                  placeholder="بدون محدودیت"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>

              {/* از تاریخ */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  از تاریخ
                </Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              {/* تا تاریخ */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  تا تاریخ
                </Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* دکمه پاک کردن فیلترها */}
            {activeFiltersCount > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                  پاک کردن فیلترها ({activeFiltersCount})
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default AdminAdvancedFilters;
