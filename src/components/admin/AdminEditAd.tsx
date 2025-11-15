import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import apiService from "@/services/api";
import { Loader2, Save, ArrowRight, Upload, X } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  type: 'rent' | 'sale';
  category_id: number;
  location: string;
  images?: string[];
  is_active?: boolean;
}

const AdminEditAd = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Partial<Listing>>({
    title: '',
    description: '',
    price: 0,
    type: 'sale',
    category_id: 0,
    location: '',
    images: [],
    is_active: true
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [listingRes, categoriesRes] = await Promise.all([
        apiService.getAdminListingDetails(parseInt(id!)),
        apiService.getCategories()
      ]);

      if (listingRes.success && listingRes.data) {
        setFormData(listingRes.data);
      }

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری اطلاعات');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total images count
    const currentCount = (formData.images?.length || 0) + newImages.length;
    if (currentCount + files.length > 10) {
      toast.error('حداکثر 10 تصویر مجاز است');
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.price || !formData.category_id) {
      toast.error('لطفاً تمام فیلدهای الزامی را پر کنید');
      return;
    }

    setSaving(true);
    try {
      // Update listing data
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        type: formData.type,
        category_id: formData.category_id,
        location: formData.location,
        is_active: formData.is_active
      };

      const response = await apiService.updateAdminListing(parseInt(id!), updateData);

      // Upload new images if any
      if (newImages.length > 0) {
        const formDataImages = new FormData();
        newImages.forEach(file => {
          formDataImages.append('images', file);
        });
        await apiService.uploadListingImages(parseInt(id!), formDataImages);
      }

      if (response.success) {
        toast.success('ویرایش آگهی با موفقیت انجام شد');
        navigate('/admin');
      }
    } catch (error) {
      toast.error('خطا در ویرایش آگهی');
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ویرایش آگهی #{id}</h1>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات آگهی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-sm font-medium">عنوان آگهی *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="عنوان آگهی را وارد کنید"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">توضیحات *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات کامل آگهی"
                rows={6}
                required
              />
            </div>

            {/* Price, Type, Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">قیمت (تومان) *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">نوع آگهی *</label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v: 'rent' | 'sale') => setFormData({ ...formData, type: v })}
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

              <div>
                <label className="text-sm font-medium">دسته‌بندی *</label>
                <Select 
                  value={formData.category_id?.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, category_id: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium">موقعیت مکانی *</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="مثال: تهران، خیابان ولیعصر"
                required
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                آگهی فعال باشد
              </label>
            </div>

            {/* Existing Images */}
            {formData.images && formData.images.length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">تصاویر فعلی</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`تصویر ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {imagePreviews.length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">تصاویر جدید</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={preview}
                        alt={`تصویر جدید ${idx + 1}`}
                        className="w-full h-32 object-cover rounded border border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div>
              <label className="text-sm font-medium block mb-2">افزودن تصاویر جدید</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    کلیک کنید یا تصاویر را بکشید و رها کنید
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    حداکثر 10 تصویر
                  </p>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                انصراف
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    ذخیره تغییرات
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default AdminEditAd;
