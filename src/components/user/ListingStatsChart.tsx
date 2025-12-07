/**
 * کامپوننت نمودار آمار بازدید آگهی
 */

import { useState, useEffect } from 'react';
import { Eye, MousePointer, Heart, TrendingUp, Calendar } from 'lucide-react';
import api from '../../services/api';

interface DailyStat {
  stat_date: string;
  view_count: number;
  unique_views: number;
  favorite_count: number;
  contact_clicks: number;
}

interface StatsSummary {
  total_views: number;
  total_unique_views: number;
  total_favorites: number;
  total_contacts: number;
  today_views: number;
  week_views: number;
}

interface Props {
  listingId: number;
  listingTitle?: string;
}

export default function ListingStatsChart({ listingId, listingTitle }: Props) {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    fetchStats();
  }, [listingId, period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [dailyRes, summaryRes] = await Promise.all([
        api.get(`/listing-stats/${listingId}/daily?days=${period}`),
        api.get(`/listing-stats/${listingId}/summary`)
      ]);

      if (dailyRes.data.success) {
        setDailyStats(dailyRes.data.stats);
      }
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.summary);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  };

  const maxViews = Math.max(...dailyStats.map(s => s.view_count), 1);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          آمار بازدید {listingTitle && `- ${listingTitle}`}
        </h3>
        <div className="flex gap-2">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setPeriod(days as 7 | 14 | 30)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                period === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {days} روز
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm">کل بازدید</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">
              {summary.total_views?.toLocaleString('fa-IR') || '۰'}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">امروز</span>
            </div>
            <p className="text-2xl font-bold text-green-700">
              {summary.today_views?.toLocaleString('fa-IR') || '۰'}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Heart className="w-5 h-5" />
              <span className="text-sm">علاقه‌مندی</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">
              {summary.total_favorites?.toLocaleString('fa-IR') || '۰'}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <MousePointer className="w-5 h-5" />
              <span className="text-sm">کلیک تماس</span>
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {summary.total_contacts?.toLocaleString('fa-IR') || '۰'}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          نمودار بازدید روزانه
        </h4>

        {dailyStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            هنوز آماری ثبت نشده است
          </div>
        ) : (
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute right-0 top-0 bottom-6 w-10 flex flex-col justify-between text-xs text-gray-400">
              <span>{maxViews}</span>
              <span>{Math.floor(maxViews / 2)}</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="mr-12 flex items-end gap-1 h-40">
              {dailyStats.map((stat, index) => {
                const height = (stat.view_count / maxViews) * 100;
                return (
                  <div
                    key={stat.stat_date}
                    className="flex-1 flex flex-col items-center group"
                  >
                    {/* Bar */}
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-8 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {stat.view_count} بازدید
                        </div>
                      </div>
                    </div>
                    {/* Date label */}
                    <span className="text-xs text-gray-400 mt-1 transform -rotate-45 origin-top-right">
                      {formatDate(stat.stat_date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
