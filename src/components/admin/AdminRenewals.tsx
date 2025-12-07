/**
 * کامپوننت مدیریت تمدید آگهی‌ها - پنل ادمین
 */

import { useState, useEffect } from 'react';
import { 
  RefreshCw, Check, X, Clock, Settings, AlertTriangle, 
  Send, Eye, Filter, ChevronDown, Loader2 
} from 'lucide-react';
import api from '../../services/api';

interface Renewal {
  id: number;
  listing_id: number;
  listing_title: string;
  user_phone: string;
  user_name: string;
  renewal_type: 'free' | 'paid';
  amount: number;
  payment_status: string;
  payment_method: string;
  payment_proof: string;
  old_expiry_date: string;
  new_expiry_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  admin_name: string;
  created_at: string;
  processed_at: string;
  images: string;
}

interface RenewalSettings {
  listing_duration_days: number;
  renewal_price: number;
  free_renewal_count: number;
  expiry_warning_days: number;
  renewal_duration_days: number;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  free_renewals: number;
  paid_renewals: number;
  total_revenue: number;
}

export default function AdminRenewals() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<RenewalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'settings'>('pending');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [renewalsRes, statsRes] = await Promise.all([
        activeTab === 'pending' 
          ? api.get('/admin/renewals/pending')
          : api.get(`/admin/renewals/all${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.get('/admin/renewals/stats')
      ]);

      if (renewalsRes.data.success) {
        setRenewals(renewalsRes.data.renewals);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/renewals/settings');
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      const response = await api.post(`/admin/renewals/${id}/approve`);
      if (response.data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Error approving:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      alert('لطفاً دلیل رد را وارد کنید');
      return;
    }

    setProcessingId(id);
    try {
      const response = await api.post(`/admin/renewals/${id}/reject`, { reason: rejectReason });
      if (response.data.success) {
        setShowRejectModal(null);
        setRejectReason('');
        fetchData();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSavingSettings(true);
    try {
      const response = await api.put('/admin/renewals/settings', settings);
      if (response.data.success) {
        alert('تنظیمات ذخیره شد');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleExpireOld = async () => {
    if (!confirm('آیا مطمئن هستید؟ آگهی‌های منقضی شده غیرفعال می‌شوند.')) return;
    
    try {
      const response = await api.post('/admin/renewals/expire-old');
      alert(response.data.message);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendReminders = async () => {
    try {
      const response = await api.post('/admin/renewals/send-reminders');
      alert(response.data.message);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">در انتظار</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">تایید شده</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">رد شده</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <RefreshCw className="w-7 h-7 text-blue-600" />
          مدیریت تمدید آگهی‌ها
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleSendReminders}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            ارسال یادآوری
          </button>
          <button
            onClick={handleExpireOld}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            منقضی کردن قدیمی‌ها
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">کل درخواست‌ها</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-600">در انتظار</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-600">تایید شده</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-600">رد شده</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-600">رایگان</p>
            <p className="text-2xl font-bold text-blue-700">{stats.free_renewals}</p>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-4">
            <p className="text-sm text-purple-600">پولی</p>
            <p className="text-2xl font-bold text-purple-700">{stats.paid_renewals}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg shadow p-4">
            <p className="text-sm text-emerald-600">درآمد</p>
            <p className="text-xl font-bold text-emerald-700">{stats.total_revenue?.toLocaleString('fa-IR')} ت</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          در انتظار تایید
          {stats?.pending ? ` (${stats.pending})` : ''}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          همه درخواست‌ها
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-4 font-medium transition-colors flex items-center gap-1 ${
            activeTab === 'settings'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          تنظیمات
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">تنظیمات تمدید آگهی</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مدت اعتبار آگهی (روز)
              </label>
              <input
                type="number"
                value={settings.listing_duration_days}
                onChange={(e) => setSettings({ ...settings, listing_duration_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                هزینه تمدید (تومان)
              </label>
              <input
                type="number"
                value={settings.renewal_price}
                onChange={(e) => setSettings({ ...settings, renewal_price: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تعداد تمدید رایگان
              </label>
              <input
                type="number"
                value={settings.free_renewal_count}
                onChange={(e) => setSettings({ ...settings, free_renewal_count: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                یادآوری چند روز قبل از انقضا
              </label>
              <input
                type="number"
                value={settings.expiry_warning_days}
                onChange={(e) => setSettings({ ...settings, expiry_warning_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مدت تمدید (روز)
              </label>
              <input
                type="number"
                value={settings.renewal_duration_days}
                onChange={(e) => setSettings({ ...settings, renewal_duration_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      )}

      {/* Renewals List */}
      {activeTab !== 'settings' && (
        <>
          {activeTab === 'all' && (
            <div className="mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">همه وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="approved">تایید شده</option>
                <option value="rejected">رد شده</option>
              </select>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : renewals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              درخواستی یافت نشد
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">آگهی</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">کاربر</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">نوع</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">مبلغ</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">تاریخ جدید</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">وضعیت</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {renewals.map(renewal => (
                    <tr key={renewal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{renewal.listing_title}</p>
                        <p className="text-xs text-gray-500">#{renewal.listing_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">{renewal.user_name || '-'}</p>
                        <p className="text-xs text-gray-500">{renewal.user_phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          renewal.renewal_type === 'free' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {renewal.renewal_type === 'free' ? 'رایگان' : 'پولی'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        {renewal.amount > 0 ? `${renewal.amount.toLocaleString('fa-IR')} ت` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {formatDate(renewal.new_expiry_date)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(renewal.status)}
                      </td>
                      <td className="px-4 py-3">
                        {renewal.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(renewal.id)}
                              disabled={processingId === renewal.id}
                              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                              title="تایید"
                            >
                              {processingId === renewal.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setShowRejectModal(renewal.id)}
                              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              title="رد"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {renewal.status !== 'pending' && renewal.admin_name && (
                          <p className="text-xs text-gray-500">توسط: {renewal.admin_name}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">رد درخواست تمدید</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="دلیل رد را وارد کنید..."
              className="w-full px-3 py-2 border rounded-lg mb-4"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={processingId === showRejectModal}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                {processingId === showRejectModal ? 'در حال پردازش...' : 'رد کردن'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
