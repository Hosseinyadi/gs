/**
 * کامپوننت درخواست تمدید آگهی
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Clock, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface RenewalInfo {
  expired: boolean;
  expiresAt: string;
  isFree: boolean;
  renewalCount: number;
  freeLimit: number;
  price: number;
}

interface Props {
  listingId: number;
  listingTitle: string;
  onSuccess?: () => void;
}

export default function RenewalRequest({ listingId, listingTitle, onSuccess }: Props) {
  const [renewalInfo, setRenewalInfo] = useState<RenewalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card_transfer' | 'wallet'>('card_transfer');
  const [paymentProof, setPaymentProof] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchRenewalInfo();
  }, [listingId]);

  const fetchRenewalInfo = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/renewals/check/${listingId}`);
      if (response.data.success) {
        setRenewalInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching renewal info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);

    try {
      const response = await api.post('/renewals/request', {
        listingId,
        paymentMethod: renewalInfo?.isFree ? null : paymentMethod,
        paymentProof: renewalInfo?.isFree ? null : paymentProof
      });

      if (response.data.success) {
        setResult({
          success: true,
          message: response.data.message
        });
        onSuccess?.();
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'خطا در ثبت درخواست'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysLeft = () => {
    if (!renewalInfo?.expiresAt) return 0;
    const now = new Date();
    const expires = new Date(renewalInfo.expiresAt);
    return Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!renewalInfo) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500">خطا در دریافت اطلاعات</p>
      </div>
    );
  }

  const daysLeft = getDaysLeft();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-blue-600" />
        تمدید آگهی
      </h3>

      {/* وضعیت فعلی */}
      <div className={`p-4 rounded-lg mb-4 ${
        renewalInfo.expired 
          ? 'bg-red-50 border border-red-200' 
          : daysLeft <= 7 
            ? 'bg-yellow-50 border border-yellow-200'
            : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Clock className={`w-5 h-5 ${
            renewalInfo.expired ? 'text-red-600' : daysLeft <= 7 ? 'text-yellow-600' : 'text-green-600'
          }`} />
          <span className="font-medium">
            {renewalInfo.expired ? 'آگهی منقضی شده' : `${daysLeft} روز تا انقضا`}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          تاریخ انقضا: {formatDate(renewalInfo.expiresAt)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          تعداد تمدید: {renewalInfo.renewalCount} از {renewalInfo.freeLimit} تمدید رایگان
        </p>
      </div>

      {/* نتیجه */}
      {result && (
        <div className={`p-4 rounded-lg mb-4 flex items-center gap-2 ${
          result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.success ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      {/* فرم تمدید */}
      {!result?.success && (
        <>
          {renewalInfo.isFree ? (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-blue-700 font-medium">
                🎉 این تمدید رایگان است!
              </p>
              <p className="text-sm text-blue-600 mt-1">
                شما هنوز {renewalInfo.freeLimit - renewalInfo.renewalCount} تمدید رایگان دارید.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-orange-50 p-4 rounded-lg mb-4">
                <p className="text-orange-700 font-medium flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  هزینه تمدید: {renewalInfo.price.toLocaleString('fa-IR')} تومان
                </p>
              </div>

              {/* روش پرداخت */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  روش پرداخت
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card_transfer"
                      checked={paymentMethod === 'card_transfer'}
                      onChange={() => setPaymentMethod('card_transfer')}
                      className="text-blue-600"
                    />
                    <span>کارت به کارت</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      className="text-blue-600"
                    />
                    <span>کیف پول</span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'card_transfer' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    شماره پیگیری / توضیحات پرداخت
                  </label>
                  <textarea
                    value={paymentProof}
                    onChange={(e) => setPaymentProof(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="شماره پیگیری یا توضیحات پرداخت خود را وارد کنید..."
                  />
                </div>
              )}
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || (!renewalInfo.isFree && paymentMethod === 'card_transfer' && !paymentProof)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ثبت...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                {renewalInfo.isFree ? 'تمدید رایگان' : 'ثبت درخواست تمدید'}
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
