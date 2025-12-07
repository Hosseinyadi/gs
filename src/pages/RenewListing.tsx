/**
 * صفحه تمدید آگهی
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { RefreshCw, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import RenewalRequest from '../components/user/RenewalRequest';
import ListingStatsChart from '../components/user/ListingStatsChart';

interface Listing {
  id: number;
  title: string;
  status: string;
  expires_at: string;
  renewal_count: number;
  images: string;
}

export default function RenewListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      if (response.data.success) {
        setListing(response.data.listing);
      } else {
        setError('آگهی یافت نشد');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    // بعد از تمدید موفق، به داشبورد برگرد
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || 'آگهی یافت نشد'}</p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            بازگشت به داشبورد
          </Link>
        </div>
      </div>
    );
  }

  const images = listing.images ? JSON.parse(listing.images) : [];
  const firstImage = images[0] || '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/dashboard"
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-blue-600" />
            تمدید آگهی
          </h1>
        </div>

        {/* Listing Info */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <img
              src={firstImage}
              alt={listing.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div>
              <h2 className="font-semibold text-gray-800">{listing.title}</h2>
              <p className="text-sm text-gray-500">شناسه: #{listing.id}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${
                listing.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : listing.status === 'expired'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
              }`}>
                {listing.status === 'active' ? 'فعال' : listing.status === 'expired' ? 'منقضی' : listing.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Renewal Form */}
          <RenewalRequest
            listingId={parseInt(id!)}
            listingTitle={listing.title}
            onSuccess={handleSuccess}
          />

          {/* Stats */}
          <ListingStatsChart
            listingId={parseInt(id!)}
            listingTitle={listing.title}
          />
        </div>
      </div>
    </div>
  );
}
