import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Download, Upload, Loader2, Database, Image, AlertTriangle } from "lucide-react";

const AdminBackupRestore = () => {
  const [backing, setBacking] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleBackupDatabase = async () => {
    setBacking(true);
    try {
      const response = await adminApi.createBackup('database');
      if (response.success) {
        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-db-${new Date().toISOString().split('T')[0]}.sql`;
        a.click();
        toast.success('بک‌آپ با موفقیت ایجاد شد');
      }
    } catch (error) {
      toast.error('خطا در ایجاد بک‌آپ');
    } finally {
      setBacking(false);
    }
  };

  const handleBackupMedia = async () => {
    setBacking(true);
    try {
      const response = await adminApi.createBackup('media');
      if (response.success) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-media-${new Date().toISOString().split('T')[0]}.zip`;
        a.click();
        toast.success('بک‌آپ رسانه‌ها ایجاد شد');
      }
    } catch (error) {
      toast.error('خطا در ایجاد بک‌آپ رسانه‌ها');
    } finally {
      setBacking(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('⚠️ هشدار: بازیابی بک‌آپ تمام داده‌های فعلی را جایگزین می‌کند. آیا ادامه می‌دهید؟')) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    try {
      const formData = new FormData();
      formData.append('backup', file);

      const response = await adminApi.restoreBackup(formData);
      if (response.success) {
        toast.success('بک‌آپ با موفقیت بازیابی شد');
      }
    } catch (error) {
      toast.error('خطا در بازیابی بک‌آپ');
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">هشدار مهم</h3>
              <p className="text-sm text-orange-800">
                قبل از هرگونه تغییر مهم در سیستم، حتماً از دیتابیس و رسانه‌ها بک‌آپ تهیه کنید.
                بازیابی بک‌آپ تمام داده‌های فعلی را جایگزین می‌کند و غیرقابل بازگشت است.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              بک‌آپ دیتابیس
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              دانلود فایل SQL شامل تمام جداول و داده‌های دیتابیس
            </p>
            <Button onClick={handleBackupDatabase} disabled={backing} className="w-full">
              {backing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 ml-2" />
                  دانلود بک‌آپ دیتابیس
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              بک‌آپ رسانه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              دانلود فایل ZIP شامل تمام تصاویر و فایل‌های آپلود شده
            </p>
            <Button onClick={handleBackupMedia} disabled={backing} className="w-full">
              {backing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 ml-2" />
                  دانلود بک‌آپ رسانه‌ها
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            بازیابی بک‌آپ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            آپلود فایل بک‌آپ (SQL یا ZIP) برای بازیابی داده‌ها
          </p>
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".sql,.zip"
              onChange={handleRestore}
              disabled={restoring}
              className="hidden"
              id="restore-file"
            />
            <label htmlFor="restore-file" className="cursor-pointer">
              {restoring ? (
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              )}
              <p className="text-sm text-gray-600">
                {restoring ? 'در حال بازیابی...' : 'کلیک کنید یا فایل را بکشید و رها کنید'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                فرمت‌های مجاز: .sql, .zip
              </p>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBackupRestore;
