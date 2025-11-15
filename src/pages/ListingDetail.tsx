import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MapPin, 
  Clock, 
  Eye, 
  Phone, 
  User, 
  Calendar,
  Settings,
  Shield,
  AlertTriangle,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Star
} from "lucide-react";
import ReviewsSection from "@/components/ReviewsSection";
import apiService from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  type: 'rent' | 'sale';
  category_name: string;
  images: string[];
  location: string;
  condition: string;
  year: number;
  brand: string;
  model: string;
  view_count: number;
  created_at: string;
  is_favorite?: boolean;
  user_name?: string;
  user_phone?: string;
  user_id?: number;
  specifications?: Record<string, any>;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => {
    if (id) {
      loadListing(parseInt(id));
    }
  }, [id]);

  const loadListing = async (listingId: number) => {
    setLoading(true);
    try {
      const response = await apiService.getListingById(listingId);
      if (response.success && response.data) {
        // Handle both response formats: data.listing or data directly
        const listingData = (response.data as any).listing || response.data;
        
        // Parse images if it's a string
        if (typeof listingData.images === 'string') {
          try {
            listingData.images = JSON.parse(listingData.images);
          } catch (e) {
            listingData.images = [];
          }
        }
        
        setListing(listingData as Listing);
      } else {
        toast.error('آگهی یافت نشد');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (error) {
      console.error('Error loading listing:', error);
      toast.error('خطا در بارگذاری آگهی');
      setTimeout(() => navigate('/'), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      toast.error('برای افزودن به علاقه‌مندی‌ها ابتدا وارد شوید');
      return;
    }

    if (!listing) return;

    try {
      const response = await apiService.toggleFavorite(listing.id);
      if (response.success) {
        setListing(prev => prev ? {
          ...prev,
          is_favorite: response.data?.is_favorite
        } : null);
        toast.success(
          response.data?.is_favorite 
            ? 'به علاقه‌مندی‌ها اضافه شد' 
            : 'از علاقه‌مندی‌ها حذف شد'
        );
      }
    } catch (error) {
      toast.error('خطا در تغییر وضعیت علاقه‌مندی');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        text: listing?.description,
        url: url,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        toast.success('لینک کپی شد');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('لینک کپی شد');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const nextImage = () => {
    if (listing && listing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === listing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (listing && listing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">آگهی یافت نشد</h2>
          <Button onClick={() => navigate(-1)}>بازگشت</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate('/')} className="hover:text-primary">
            خانه
          </button>
          <span>/</span>
          <button onClick={() => navigate(listing.type === 'sale' ? '/sale' : '/rent')} className="hover:text-primary">
            {listing.type === 'sale' ? 'فروش' : 'اجاره'}
          </button>
          <span>/</span>
          <span className="text-foreground">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {listing.images && listing.images.length > 0 ? (
                  <div className="relative">
                    <img
                      src={listing.images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-96 object-cover"
                    />
                    {listing.images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {listing.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex 
                                  ? 'bg-white w-8' 
                                  : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                    <Badge className="absolute top-4 right-4 bg-primary text-lg px-4 py-2">
                      {listing.type === 'sale' ? 'فروش' : 'اجاره'}
                    </Badge>
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">بدون تصویر</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Title and Price */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold">{listing.title}</h1>
                      {listing.is_featured && (
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1">
                          <Star className="w-4 h-4 ml-1" />
                          ویژه
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{listing.view_count} بازدید</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(listing.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleFavoriteToggle}
                    >
                      <Heart 
                        className={`h-5 w-5 ${
                          listing.is_favorite 
                            ? 'fill-red-500 text-red-500' 
                            : ''
                        }`} 
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(listing.price)}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4">توضیحات</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  مشخصات فنی
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {listing.brand && (
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-muted-foreground">برند:</span>
                      <span className="font-semibold">{listing.brand}</span>
                    </div>
                  )}
                  {listing.model && (
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-muted-foreground">مدل:</span>
                      <span className="font-semibold">{listing.model}</span>
                    </div>
                  )}
                  {listing.year && (
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-muted-foreground">سال ساخت:</span>
                      <span className="font-semibold">{listing.year}</span>
                    </div>
                  )}
                  {listing.condition && (
                    <div className="flex justify-between py-3 border-b">
                      <span className="text-muted-foreground">وضعیت:</span>
                      <span className="font-semibold">{listing.condition}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-muted-foreground">دسته‌بندی:</span>
                    <span className="font-semibold">{listing.category_name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-muted-foreground">موقعیت:</span>
                    <span className="font-semibold">{listing.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Warning */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <h3 className="font-bold mb-2">⚠️ نکات ایمنی هنگام معامله:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>حتماً قبل از پرداخت وجه، دستگاه را به صورت حضوری بررسی کنید</li>
                  <li>از پرداخت پیش‌پرداخت بدون دیدن کالا خودداری کنید</li>
                  <li>اصالت مدارک و سند دستگاه را بررسی نمایید</li>
                  <li>در صورت امکان از کارشناس متخصص کمک بگیرید</li>
                  <li>از انجام معامله در مکان‌های عمومی و امن استفاده کنید</li>
                  <li>هیچ‌گاه اطلاعات بانکی خود را به اشتراک نگذارید</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Reviews Section */}
            <ReviewsSection 
              listingId={listing.id} 
              listingOwnerId={listing.user_id}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  اطلاعات تماس
                </h3>
                
                <div className="space-y-4">
                  {listing.user_name && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">نام فروشنده</div>
                        <div className="font-semibold">{listing.user_name}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">موقعیت</div>
                      <div className="font-semibold">{listing.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">تاریخ انتشار</div>
                      <div className="font-semibold">{formatDate(listing.created_at)}</div>
                    </div>
                  </div>

                  <Separator />

                  {listing.user_phone ? (
                    <div className="space-y-3">
                      {showPhone ? (
                        <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                          <Phone className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <div className="text-sm text-muted-foreground">شماره تماس</div>
                            <div className="font-bold text-lg direction-ltr text-left">
                              {listing.user_phone}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={() => setShowPhone(true)}
                        >
                          <Phone className="w-5 h-5 ml-2" />
                          نمایش شماره تماس
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`tel:${listing.user_phone}`)}
                      >
                        تماس تلفنی
                      </Button>

                      {isAuthenticated && (
                        <Button 
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                          onClick={() => navigate(`/make-featured?listing_id=${listing.id}`)}
                        >
                          <Star className="w-5 h-5 ml-2" />
                          ویژه کردن آگهی
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        شماره تماس در دسترس نیست
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security Tips */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-900">
                  <Shield className="w-5 h-5" />
                  نکات امنیتی
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>هرگز پیش از دیدن کالا پول پرداخت نکنید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>به آگهی‌های مشکوک و قیمت‌های غیرمعمول توجه نکنید</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>از واریز وجه به حساب اشخاص ثالث خودداری کنید</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ListingDetail;
