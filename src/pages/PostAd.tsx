import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProvinceSelect from "@/components/ui/ProvinceSelect";
import ImageUpload from "@/components/ui/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import apiService from "@/services/api";
import { toast } from "sonner";
import { formatPriceWithWords } from "@/utils/numberToWords";
import { generateListingSeoTags } from "@/utils/seo";
import { 
  Plus, 
  Save, 
  X, 
  Upload,
  Loader2,
  ArrowLeft,
  CheckCircle
} from "lucide-react";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

const PostAd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  console.log('🔵 PostAd mounted - isAuthenticated:', isAuthenticated, 'user:', user);
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: number; name: string; province_id: number }[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<{ id: number; name: string; city_id: number }[]>([]);
  const [step, setStep] = useState(0); // شروع از انتخاب نوع آگهی
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    priceType: 'fixed' as 'fixed' | 'negotiable', // قیمت ثابت یا توافقی
    type: '' as 'rent' | 'sale' | '', // ابتدا خالی
    category_id: '',
    province: '',
    provinceId: '',
    cityId: '',
    neighborhoodId: '',
    condition: '',
    year: '',
    brand: '',
    model: '',
    specifications: '{}',
    images: [] as string[],
    tags: [] as string[],
  });

  // Load saved province
  useEffect(() => {
    const savedProvince = localStorage.getItem('selectedProvince');
    if (savedProvince && savedProvince !== 'تمام شهرها') {
      setForm(prev => ({ ...prev, province: savedProvince }));
    }
  }, []);

  useEffect(() => {
    // چک کردن authentication - اگر لاگین نیست، فوراً redirect کن
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to auth...');
      toast.error('برای ثبت آگهی ابتدا باید وارد شوید');
      navigate('/auth', { 
        state: { from: location.pathname },
        replace: true 
      });
      return;
    }
    
    console.log('✅ User authenticated, loading categories & locations...');
    // Load categories & provinces when component mounts
    loadCategories();
    loadProvinces();
  }, [isAuthenticated, navigate, location]);

  // Preselect type from query (?type=rent|sale) or state
  useEffect(() => {
    // First check state (from PostAdType navigation)
    const stateType = location.state?.type;
    if (stateType === 'rent' || stateType === 'sale') {
      setForm(prev => ({ ...prev, type: stateType as 'rent' | 'sale' }));
      return;
    }
    
    // Fallback to query params
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    if (typeParam === 'rent' || typeParam === 'sale') {
      setForm(prev => ({ ...prev, type: typeParam as 'rent' | 'sale' }));
    }
  }, [location.search, location.state]);

  const loadCategories = async () => {
    try {
      console.log('🔵 Loading categories...');
      const response = await apiService.getCategories();
      console.log('🔵 Categories response:', response);
      if (response.success && response.data?.categories) {
        console.log('✅ Categories loaded:', response.data.categories.length);
        setCategories(response.data.categories);
      } else {
        console.error('❌ Categories response not successful:', response);
        // تلاش مجدد با یک تاخیر کوتاه
        setTimeout(loadCategories, 1000);
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      toast.error('خطا در بارگذاری دسته‌بندی‌ها');
    }
  };

  const loadProvinces = async () => {
    try {
      const response = await apiService.getProvinces();
      if (response.success && response.data?.provinces) {
        setProvinces(response.data.provinces);
      } else {
        console.error('❌ Provinces response not successful:', response);
        setTimeout(loadProvinces, 1000);
      }
    } catch (error) {
      console.error('❌ Error loading provinces:', error);
      toast.error('خطا در بارگذاری استان‌ها');
    }
  };

  const loadCitiesForProvince = async (provinceId: number) => {
    try {
      const response = await apiService.getCities(provinceId);
      if (response.success && response.data?.cities) {
        setCities(response.data.cities);
      } else {
        console.error('❌ Cities response not successful:', response);
        setCities([]);
      }
    } catch (error) {
      console.error('❌ Error loading cities:', error);
      setCities([]);
    }
  };

  const loadNeighborhoodsForCity = async (cityId: number) => {
    try {
      const response = await apiService.getNeighborhoods(cityId);
      if (response.success && response.data?.neighborhoods) {
        setNeighborhoods(response.data.neighborhoods);
      } else {
        console.error('❌ Neighborhoods response not successful:', response);
        setNeighborhoods([]);
      }
    } catch (error) {
      console.error('❌ Error loading neighborhoods:', error);
      setNeighborhoods([]);
    }
  };

  const handleProvinceChange = (value: string) => {
    const provinceName = value === 'تمام شهرها' ? '' : value;

    // ریست شهر و محله هنگام تغییر استان
    setForm(prev => ({
      ...prev,
      province: provinceName,
      provinceId: '',
      cityId: '',
      neighborhoodId: '',
    }));
    setCities([]);
    setNeighborhoods([]);

    if (!provinceName) return;

    const matched = provinces.find(p => p.name === provinceName);
    if (matched) {
      setForm(prev => ({
        ...prev,
        province: provinceName,
        provinceId: matched.id.toString(),
        cityId: '',
        neighborhoodId: '',
      }));
      void loadCitiesForProvince(matched.id);
    }
  };

  const handleCityChange = (value: string) => {
    const cityId = parseInt(value, 10);
    const city = cities.find(c => c.id === cityId) || null;

    setForm(prev => ({
      ...prev,
      cityId: value,
      neighborhoodId: '',
    }));
    setNeighborhoods([]);

    // فقط برای شهر «تهران» محله‌ها را لود کن
    if (city && city.name === 'تهران') {
      void loadNeighborhoodsForCity(cityId);
    }
  };

  const handleNeighborhoodChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      neighborhoodId: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // چک نهایی authentication قبل از ارسال
    if (!isAuthenticated || !user) {
      toast.error('لطفاً ابتدا وارد حساب کاربری خود شوید');
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }
    
    console.log('🔵 Form data:', form);
    const isCityRequired = cities.length > 0;
    
    if (!form.title || !form.description || !form.category_id || !form.province || !form.type || (isCityRequired && !form.cityId) || form.images.length === 0) {
      console.error('❌ Missing required fields:', {
        title: !!form.title,
        description: !!form.description,
        category_id: !!form.category_id,
        province: !!form.province,
        type: !!form.type,
        cityId: !!form.cityId,
        images: form.images.length
      });
      
      if (form.images.length === 0) {
        toast.error('لطفاً حداقل 1 عکس آپلود کنید');
      } else {
        toast.error('لطفاً فیلدهای اجباری را پر کنید');
      }
      return;
    }

    if (form.priceType === 'fixed' && !form.price) {
      console.error('❌ Price is required for fixed price type');
      toast.error('لطفاً قیمت را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const city = form.cityId ? cities.find(c => c.id.toString() === form.cityId) : undefined;
      const neighborhood = form.neighborhoodId ? neighborhoods.find(n => n.id.toString() === form.neighborhoodId) : undefined;

      // location متنی ترکیبی: استان، شهر، محله (در صورت وجود)
      let locationText = form.province || '';
      if (city) {
        locationText = locationText ? `${locationText}، ${city.name}` : city.name;
      }
      if (neighborhood) {
        locationText = locationText ? `${locationText}، ${neighborhood.name}` : neighborhood.name;
      }

      const category = categories.find((c) => c.id.toString() === form.category_id);
      const autoTags = generateListingSeoTags({
        title: form.title,
        type: form.type as 'rent' | 'sale',
        categoryName: category?.name,
        provinceName: form.province,
        cityName: city?.name,
        neighborhoodName: neighborhood?.name,
      });

      const listingData = {
        title: form.title,
        description: form.description,
        price: form.priceType === 'negotiable' ? 0 : parseFloat(form.price),
        type: form.type as 'rent' | 'sale',
        category_id: parseInt(form.category_id),
        location: locationText || form.province, // location متنی برای نمایش
        province_id: form.provinceId ? parseInt(form.provinceId) : undefined,
        city_id: form.cityId ? parseInt(form.cityId) : undefined,
        neighborhood_id: form.neighborhoodId ? parseInt(form.neighborhoodId) : undefined,
        condition: form.condition || '',
        year: form.year ? parseInt(form.year) : undefined,
        brand: form.brand || '',
        model: form.model || '',
        specifications: {
          ...(form.specifications ? JSON.parse(form.specifications) : {}),
          priceType: form.priceType,
          isNegotiable: form.priceType === 'negotiable',
          tags: autoTags,
        },
        images: form.images,
      };

      console.log('🔵 Creating listing with data:', listingData);
      console.log('🔵 Data types:', {
        title: typeof listingData.title,
        description: typeof listingData.description,
        price: typeof listingData.price,
        type: typeof listingData.type,
        category_id: typeof listingData.category_id,
        location: typeof listingData.location,
        province_id: typeof listingData.province_id,
        city_id: typeof listingData.city_id,
        neighborhood_id: typeof listingData.neighborhood_id,
      });
      
      const response = await apiService.createListing(listingData);
      console.log('🔵 Create listing response:', response);

      if (response.success) {
        toast.success('آگهی با موفقیت ثبت شد و در انتظار تایید مدیر است');
        // Redirect to user dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        // بررسی نیاز به پرداخت (کد 402)
        const responseData = response as any;
        if (responseData.needs_payment) {
          toast.info(responseData.message || 'برای ثبت آگهی اضافی نیاز به پرداخت دارید', { duration: 5000 });
          // هدایت به صفحه پرداخت کارت به کارت
          navigate('/payment/card-transfer', { 
            state: { 
              payment_id: responseData.payment_id,
              amount: responseData.amount,
              type: 'additional_listing',
              listing_data: listingData
            } 
          });
          return;
        }
        
        // نمایش پیام خطای دقیق
        let errorMessage = response.message || 'خطا در ثبت آگهی';
        
        // اگر خطای validation است، جزئیات را نمایش بده
        if (response.errors && Array.isArray(response.errors)) {
          const errorDetails = response.errors.map((err: any) => err.msg || err.message).join('\n');
          errorMessage = `خطا در اطلاعات آگهی:\n${errorDetails}`;
          console.error('Validation errors:', response.errors);
        }
        
        toast.error(errorMessage, { duration: 5000 });
        console.error('Create listing failed:', response);
      }
    } catch (error: any) {
      console.error('❌ Error creating listing:', error);
      
      // بررسی نیاز به پرداخت از خطا
      if (error?.needs_payment || error?.response?.data?.needs_payment) {
        const paymentData = error?.response?.data || error;
        toast.info(paymentData.message || 'برای ثبت آگهی اضافی نیاز به پرداخت دارید', { duration: 5000 });
        navigate('/payment/card-transfer', { 
          state: { 
            payment_id: paymentData.payment_id,
            amount: paymentData.amount,
            type: 'additional_listing',
            listing_data: listingData
          } 
        });
        return;
      }
      
      // پیام‌های خطای واضح‌تر
      let errorMessage = 'خطا در ثبت آگهی';
      
      if (error?.message === 'Access denied. No token provided.') {
        errorMessage = 'لطفاً ابتدا وارد حساب کاربری خود شوید';
        toast.error(errorMessage);
        setTimeout(() => {
          navigate('/auth', { state: { from: location.pathname } });
        }, 1500);
        return;
      } else if (error?.message === 'Failed to fetch') {
        errorMessage = 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 5000 });
      
      // Log detailed error for debugging
      console.error('Detailed error:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 0 && !form.type) {
      toast.error('لطفاً نوع آگهی را انتخاب کنید');
      return;
    }
    if (step === 1 && (!form.title || !form.category_id)) {
      toast.error('لطفاً فیلدهای اجباری را پر کنید');
      return;
    }
    if (step === 2 && (!form.description || (form.priceType === 'fixed' && !form.price) || !form.province || (cities.length > 0 && !form.cityId) || form.images.length === 0)) {
      if (form.images.length === 0) {
        toast.error('لطفاً حداقل 1 عکس آپلود کنید');
      } else {
        toast.error('لطفاً فیلدهای اجباری را پر کنید');
      }
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    return new Intl.NumberFormat('fa-IR').format(parseFloat(price)) + ' تومان';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ثبت آگهی جدید</h1>
            <p className="text-muted-foreground">آگهی خود را در چند مرحله ثبت کنید</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[0, 1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= stepNumber 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > stepNumber ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    stepNumber + 1
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                مرحله {step + 1} از 4: {
                  step === 0 ? 'انتخاب نوع آگهی' :
                  step === 1 ? 'اطلاعات کلی' :
                  step === 2 ? 'جزئیات آگهی' :
                  'تایید و ثبت'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {step === 0 && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-semibold mb-2">آگهی شما برای چیست؟</h3>
                      <p className="text-muted-foreground">نوع آگهی خود را انتخاب کنید</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          form.type === 'sale' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, type: 'sale' }))}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">💰</span>
                          </div>
                          <h4 className="text-lg font-semibold mb-2">فروش</h4>
                          <p className="text-sm text-muted-foreground">
                            ماشین‌آلات، قطعات یا تجهیزات خود را بفروشید
                          </p>
                        </div>
                      </div>
                      
                      <div 
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          form.type === 'rent' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setForm(prev => ({ ...prev, type: 'rent' }))}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🏗️</span>
                          </div>
                          <h4 className="text-lg font-semibold mb-2">اجاره</h4>
                          <p className="text-sm text-muted-foreground">
                            ماشین‌آلات خود را برای اجاره قرار دهید
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">عنوان آگهی *</label>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="عنوان جذاب برای آگهی خود بنویسید"
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">نوع آگهی *</label>
                        <Select value={form.type} onValueChange={(value) => setForm(prev => ({ ...prev, type: value as 'rent' | 'sale' }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب نوع" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
                            <SelectItem value="rent">اجاره</SelectItem>
                            <SelectItem value="sale">فروش</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-2">دسته‌بندی *</label>
                        <Select value={form.category_id} onValueChange={(value) => setForm(prev => ({ ...prev, category_id: value }))}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب دسته‌بندی" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto z-50">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">توضیحات *</label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="توضیحات کامل و دقیق از آگهی خود بنویسید"
                        className="w-full min-h-[120px]"
                        rows={5}
                        required
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">نوع قیمت *</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div 
                            className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                              form.priceType === 'fixed' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setForm(prev => ({ ...prev, priceType: 'fixed' }))}
                          >
                            <span className="text-sm font-medium">قیمت ثابت</span>
                          </div>
                          <div 
                            className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                              form.priceType === 'negotiable' 
                                ? 'border-primary bg-primary/5' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setForm(prev => ({ ...prev, priceType: 'negotiable' }))}
                          >
                            <span className="text-sm font-medium">توافقی</span>
                          </div>
                        </div>
                      </div>

                      {form.priceType === 'fixed' && (
                        <div>
                          <label className="text-sm font-medium block mb-2">
                            قیمت ({form.type === 'rent' ? 'روزانه' : 'کل'}) - تومان *
                          </label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={form.price}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              setForm(prev => ({ ...prev, price: value }));
                            }}
                            placeholder={form.type === 'rent' ? "مثال: 500000" : "مثال: 5000000"}
                            className="w-full"
                            required
                          />
                          {form.price && parseFloat(form.price) > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                {formatPriceWithWords(form.price).numeric}
                                {form.type === 'rent' ? ' (روزانه)' : ''}
                              </p>
                              <p className="text-sm text-green-600 font-medium">
                                {formatPriceWithWords(form.price).words}
                                {form.type === 'rent' ? ' (روزانه)' : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {form.priceType === 'negotiable' && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            💡 قیمت آگهی شما "توافقی" نمایش داده خواهد شد و خریداران می‌توانند با شما تماس بگیرند.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium block mb-2">استان *</label>
                      <ProvinceSelect
                        value={form.province}
                        onValueChange={handleProvinceChange}
                        placeholder="انتخاب استان"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        استان محل قرارگیری ماشین‌آلات را انتخاب کنید
                      </p>
                    </div>

                    {cities.length > 0 && (
                      <div>
                        <label className="text-sm font-medium block mb-2">شهر *</label>
                        <Select
                          value={form.cityId}
                          onValueChange={handleCityChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب شهر" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto z-50">
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id.toString()}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          شهر مربوط به استان انتخاب‌شده را انتخاب کنید
                        </p>
                      </div>
                    )}

                    {neighborhoods.length > 0 && (
                      <div>
                        <label className="text-sm font-medium block mb-2">محله (فقط برای شهر تهران)</label>
                        <Select
                          value={form.neighborhoodId}
                          onValueChange={handleNeighborhoodChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="انتخاب محله" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-[300px] overflow-y-auto z-50">
                            {neighborhoods.map((n) => (
                              <SelectItem key={n.id} value={n.id.toString()}>
                                {n.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          برای شهر تهران می‌توانید محله دقیق را انتخاب کنید
                        </p>
                      </div>
                    )}

                    {/* آپلود تصاویر */}
                    <ImageUpload
                      images={form.images}
                      onImagesChange={(images) => setForm(prev => ({ ...prev, images }))}
                      maxImages={5}
                      minImages={1}
                      required={true}
                    />

                    {/* فیلدهای اضافی برای فروش */}
                    {form.type === 'sale' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium block mb-2">برند</label>
                            <Input
                              value={form.brand}
                              onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                              placeholder="مثال: کوماتسو"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-2">مدل</label>
                            <Input
                              value={form.model}
                              onChange={(e) => setForm(prev => ({ ...prev, model: e.target.value }))}
                              placeholder="مثال: PC200"
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-2">سال ساخت</label>
                            <Input
                              type="number"
                              value={form.year}
                              onChange={(e) => setForm(prev => ({ ...prev, year: e.target.value }))}
                              placeholder="مثال: 2020"
                              className="w-full"
                              min="1900"
                              max="2030"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium block mb-2">وضعیت دستگاه</label>
                          <Select value={form.condition} onValueChange={(value) => setForm(prev => ({ ...prev, condition: value }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="انتخاب وضعیت" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="نو">نو</SelectItem>
                              <SelectItem value="در حد نو">در حد نو</SelectItem>
                              <SelectItem value="عالی">عالی</SelectItem>
                              <SelectItem value="خوب">خوب</SelectItem>
                              <SelectItem value="قابل قبول">قابل قبول</SelectItem>
                              <SelectItem value="نیاز به تعمیر">نیاز به تعمیر</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* فیلدهای ساده‌تر برای اجاره */}
                    {form.type === 'rent' && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">ℹ️ نکات مهم برای اجاره:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• قیمت روزانه را وارد کنید</li>
                          <li>• حداقل مدت اجاره را در توضیحات ذکر کنید</li>
                          <li>• شرایط تحویل و بازگشت را مشخص کنید</li>
                          <li>• هزینه حمل و نقل را در توضیحات بیان کنید</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">خلاصه آگهی شما:</h3>
                      <div className="space-y-2 text-sm">
                        <p><strong>عنوان:</strong> {form.title}</p>
                        <p><strong>نوع:</strong> {form.type === 'rent' ? 'اجاره' : 'فروش'}</p>
                        <p><strong>دسته‌بندی:</strong> {categories.find(c => c.id.toString() === form.category_id)?.name}</p>
                        {form.priceType === 'negotiable' ? (
                          <p><strong>قیمت:</strong> توافقی</p>
                        ) : form.price && parseFloat(form.price) > 0 ? (
                          <div>
                            <p><strong>قیمت:</strong></p>
                            <p className="mr-4 text-gray-700">
                              {formatPriceWithWords(form.price).numeric}
                              {form.type === 'rent' ? ' (روزانه)' : ''}
                            </p>
                            <p className="mr-4 text-green-600 font-medium">
                              {formatPriceWithWords(form.price).words}
                              {form.type === 'rent' ? ' (روزانه)' : ''}
                            </p>
                          </div>
                        ) : null}
                        {form.province && <p><strong>استان:</strong> {form.province}</p>}
                        {form.brand && <p><strong>برند:</strong> {form.brand}</p>}
                        {form.model && <p><strong>مدل:</strong> {form.model}</p>}
                        {form.year && <p><strong>سال:</strong> {form.year}</p>}
                        {form.condition && <p><strong>وضعیت:</strong> {form.condition}</p>}
                        {form.tags.length > 0 && (
                          <div>
                            <strong>تگ‌ها:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {form.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <p><strong>توضیحات:</strong> {form.description}</p>
                        {form.images.length > 0 && (
                          <div>
                            <strong>تصاویر:</strong>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                              {form.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`تصویر ${idx + 1}`}
                                  className="w-full h-20 object-cover rounded border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">نکات مهم:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• آگهی شما پس از تایید ادمین منتشر خواهد شد</li>
                        <li>• اطلاعات تماس شما در آگهی نمایش داده می‌شود</li>
                        <li>• می‌توانید آگهی خود را در پنل فروشنده مدیریت کنید</li>
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-6 border-t">
                  {step > 0 && (
                    <Button type="button" variant="outline" onClick={prevStep} className="px-6">
                      <ArrowLeft className="w-4 h-4 ml-2" />
                      مرحله قبل
                    </Button>
                  )}
                  
                  {step < 3 ? (
                    <Button 
                      type="button" 
                      onClick={nextStep} 
                      className="flex-1 h-11"
                      disabled={step === 0 && !form.type}
                    >
                      مرحله بعد
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="flex-1 h-11 bg-green-600 hover:bg-green-700">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          در حال ثبت...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 ml-2" />
                          ثبت نهایی آگهی
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PostAd;