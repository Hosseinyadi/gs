/**
 * کامپوننت نمایش آگهی‌های در حال انقضا
 */

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface ExpiringListing {
  id: number;
  title: string;
  expires_at: string;
  status: string;
  renewal_count: number;
  daysLeft: number;
  isExpired: boolean;
}

export default function ExpiringListings() {
  const [listings, setListings] = useState<ExpiringListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpiringListings();
  }, []);

  const fetchExpiringListings = async () => {
    try {
      const response = await api.get('/renewals/expiring');
      if (response.data.success) {
        setListings(response.data.listings);
      }
    } catch (error) {
      console.error('Error fetching expiring listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  // فقط آگهی‌هایی که کمتر از 14 روز مانده یا منقضی شدن
  const urgentListings = listings.filter(l => l.daysLeft <= 14 || l.isExpired);

  if (urgentListings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-orange-500" />
        آگهی‌های نیازمند توجه
      </h3>

      <div className="space-y-3">
        {urgentListings.map(listing => (
          <div
            key={listing.id}
            className={`p-4 rounded-lg border ${
              listing.isExpired 
                ? 'bg-red-50 border-red-200' 
                : listing.daysLeft <= 3 
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-800">{listing.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-sm">
                  {listing.isExpired ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      منقضی شده
                    </span>
                  ) : (
                    <span className={`${listing.daysLeft <= 3 ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {listing.daysLeft} روز تا انقضا
                    </span>
                  )}
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">
                    انقضا: {formatDate(listing.expires_at)}
                  </span>
                </div>
              </div>
              
              <Link
                to={`/dashboard/renew/${listing.id}`}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                تمدید
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
