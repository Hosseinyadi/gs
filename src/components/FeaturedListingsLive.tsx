import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MapPin, Eye, Clock, Star, ArrowLeft, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface FeaturedListing {
  id: number;
  title: string;
  price: number;
  type: 'rent' | 'sale';
  category_name: string;
  images: string[];
  location: string;
  view_count: number;
  created_at: string;
  is_featured: boolean;
}

const FeaturedListingsLive = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<FeaturedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedListings();
  }, []);

  const loadFeaturedListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/listings/featured`);
      const data = await response.json();

      if (data.success) {
        setListings(data.data || []);
      }
    } catch (error) {
      console.error('Error loading featured listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    if (diffDays < 7) return `${diffDays} روز پیش`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`;
    return date.toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-yellow-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">در حال بارگذاری آگهی‌های ویژه...</p>
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return null; // Don't show section if no featured listings
  }

  return (
    <section className="py-16 bg-gradient-to-b from-yellow-50 via-orange-50 to-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4 animate-pulse">
            <Star className="w-8 h-8 text-white fill-current" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
            آگهی‌های ویژه
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            برترین ماشین‌آلات سنگین با دیده شدن بیشتر
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {listings.slice(0, 6).map((listing) => (
            <Card 
              key={listing.id} 
              className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-yellow-200 hover:border-yellow-400"
              onClick={() => navigate(`/${listing.type}/${listing.id}`)}
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-xl">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <Star className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge 
                      className={`font-bold ${
                        listing.type === 'rent' 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      {listing.type === 'rent' ? 'اجاره' : 'فروش'}
                    </Badge>
                  </div>

                  {/* Featured Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 animate-pulse">
                      <Star className="w-3 h-3 ml-1 fill-current" />
                      ویژه
                    </Badge>
                  </div>

                  {/* Trending Badge */}
                  <div className="absolute bottom-4 right-4">
                    <Badge className="bg-white/90 text-gray-800 border-0">
                      <TrendingUp className="w-3 h-3 ml-1" />
                      پربازدید
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {listing.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">قیمت:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {formatPrice(listing.price)}
                      <span className="text-sm text-gray-600 mr-1">تومان</span>
                    </span>
                  </div>

                  {listing.category_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">دسته‌بندی:</span>
                      <Badge variant="outline">{listing.category_name}</Badge>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
                  {listing.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{listing.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{listing.view_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(listing.created_at)}</span>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                <Button 
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/${listing.type}/${listing.id}`);
                  }}
                >
                  مشاهده جزئیات
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        {listings.length > 6 && (
          <div className="text-center">
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={() => navigate('/search?featured=true')}
            >
              مشاهده همه آگهی‌های ویژه
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-8 text-center">
          <Star className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">می‌خواهید آگهی خود را ویژه کنید؟</h3>
          <p className="text-gray-700 mb-6">
            با ویژه کردن آگهی، دیده شدن شما تا 10 برابر افزایش می‌یابد
          </p>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            onClick={() => navigate('/make-featured')}
          >
            <Star className="w-5 h-5 ml-2" />
            ویژه کردن آگهی
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListingsLive;
