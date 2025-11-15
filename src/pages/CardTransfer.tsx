import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  CreditCard,
  Upload,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface CardInfo {
  card_number: string;
  card_holder_name: string;
  bank_name: string;
}

const CardTransfer = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  const [cardInfo, setCardInfo] = useState<CardInfo | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!paymentId) {
      toast.error('شناسه پرداخت یافت نشد');
      navigate('/');
      return;
    }
    loadCardInfo();
  }, [paymentId, navigate]);

  const loadCardInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Get payment details
      const paymentResponse = await fetch(`${import.meta.env.VITE_API_URL}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const paymentData = await paymentResponse.json();
      if (paymentData.success) {
        setAmount(paymentData.data.amount);
      }

      // Get card info from settings
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/settings/payment`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCardInfo({
          card_number: data.data.card_number || '6037-9971-1234-5678',
          card_holder_name: data.data.card_holder_name || 'گاراژ سنگین',
          bank_name: data.data.bank_name || 'ملت'
        });
      }
    } catch (error) {
      console.error('Error loading card info:', error);
      toast.error('خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCardNumber = () => {
    if (cardInfo?.card_number) {
      navigator.clipboard.writeText(cardInfo.card_number.replace(/-/g, ''));
      toast.success('شماره کارت کپی شد');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم فایل نباید بیشتر از 5 مگابایت باشد');
        return;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('فقط فایل‌های تصویری (JPG, PNG) و PDF مجاز هستند');
        return;
      }

      setReceiptFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!receiptFile) {
      toast.error('لطفا رسید پرداخت را آپلود کنید');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('listing_id', searchParams.get('listing_id') || '');
      formData.append('plan_id', searchParams.get('plan_id') || '');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/card-transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        toast.success('رسید با موفقیت ثبت شد');
        navigate('/payment/pending');
      } else {
        toast.error(data.error?.message || 'خطا در ثبت رسید');
      }
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('خطا در ثبت رسید');
    } finally {
      setUploading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            پرداخت کارت به کارت
          </h1>
          <p className="text-gray-600 text-lg">
            مبلغ را به شماره کارت زیر واریز کنید و رسید را آپلود نمایید
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border-2 border-purple-200 text-center">
            <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              1
            </div>
            <p className="text-sm font-medium">واریز مبلغ</p>
          </div>
          <div className="bg-white p-4 rounded-lg border-2 border-purple-200 text-center">
            <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              2
            </div>
            <p className="text-sm font-medium">آپلود رسید</p>
          </div>
          <div className="bg-white p-4 rounded-lg border-2 border-purple-200 text-center">
            <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
              3
            </div>
            <p className="text-sm font-medium">تایید مدیر</p>
          </div>
        </div>

        {/* Card Info */}
        <Card className="mb-6 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              اطلاعات کارت مقصد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">شماره کارت</p>
                  <p className="text-2xl font-bold font-mono direction-ltr text-left">
                    {cardInfo?.card_number}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCardNumber}
                >
                  <Copy className="w-4 h-4 ml-1" />
                  کپی
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">نام صاحب کارت</p>
                  <p className="font-medium">{cardInfo?.card_holder_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">بانک</p>
                  <p className="font-medium">{cardInfo?.bank_name}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-orange-900 mb-1">مبلغ قابل پرداخت</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatPrice(amount)} تومان
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Receipt */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              آپلود رسید پرداخت
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="receipt">تصویر یا PDF رسید</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileChange}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-2">
                فرمت‌های مجاز: JPG, PNG, PDF - حداکثر 5 مگابایت
              </p>
            </div>

            {receiptFile && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  فایل {receiptFile.name} انتخاب شد ({(receiptFile.size / 1024).toFixed(0)} KB)
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!receiptFile || uploading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              size="lg"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 ml-2" />
                  ثبت رسید و ارسال برای تایید
                  <ArrowRight className="w-5 h-5 mr-2" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-900">
              <Clock className="w-5 h-5" />
              نکات مهم
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>مبلغ را دقیقاً به همان مقدار ذکر شده واریز کنید</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>رسید پرداخت باید واضح و خوانا باشد</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>پس از تایید مدیر، آگهی شما به صورت خودکار ویژه می‌شود</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>زمان تایید معمولاً کمتر از 2 ساعت است</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardTransfer;
