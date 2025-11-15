import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Download, 
  Trash2, 
  Calendar, 
  HardDrive,
  Lock,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";

interface BackupFile {
  filename: string;
  backup_id: string;
  size: number;
  created_at: string;
  size_mb: number;
}

interface BackupStats {
  total_backups: number;
  total_size_mb: number;
  average_size_mb: number;
  oldest_backup: string | null;
  newest_backup: string | null;
}

interface BackupData {
  backups: BackupFile[];
  statistics: BackupStats;
}

const AdminMonthlyBackup = () => {
  const [data, setData] = useState<BackupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backup/monthly/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error loading backup data:', error);
      toast.error('خطا در بارگذاری اطلاعات پشتیبان');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (password !== confirmPassword) {
      toast.error('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    if (password.length < 8) {
      toast.error('رمز عبور باید حداقل 8 کاراکتر باشد');
      return;
    }

    setCreating(true);
    setProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backup/monthly`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();
      if (result.success) {
        toast.success('پشتیبان ماهانه با موفقیت ایجاد شد');
        setShowCreateDialog(false);
        setPassword('');
        setConfirmPassword('');
        loadBackupData();
      } else {
        toast.error(result.message || 'خطا در ایجاد پشتیبان');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setCreating(false);
      setProgress(0);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      toast.info('شروع دانلود پشتیبان...');
      
      const token = localStorage.getItem('adminToken');
      const downloadUrl = `${import.meta.env.VITE_API_URL}/admin/backup/monthly/download/${backupId}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('Authorization', `Bearer ${token}`);
      link.download = `${backupId}.encrypted`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('دانلود پشتیبان آغاز شد');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('خطا در دانلود پشتیبان');
    }
  };

  const handleCleanupBackups = async () => {
    setCleaning(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/backup/monthly/cleanup`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`${result.data.deleted} پشتیبان قدیمی حذف شد`);
        setShowCleanupDialog(false);
        loadBackupData();
      } else {
        toast.error(result.message || 'خطا در پاک‌سازی پشتیبان‌ها');
      }
    } catch (error) {
      console.error('Error cleaning backups:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setCleaning(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">پشتیبان‌گیری ماهانه</h1>
            <p className="text-gray-600">مدیریت پشتیبان‌های امن و رمزگذاری شده</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Database className="w-4 h-4 ml-2" />
          ایجاد پشتیبان جدید
        </Button>
      </div>

      {/* Statistics Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {data.statistics.total_backups}
              </div>
              <div className="text-sm text-gray-600">کل پشتیبان‌ها</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <HardDrive className="w-8 h-8 text-green-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-green-600 mb-2">
                {data.statistics.total_size_mb.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">مگابایت کل</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {data.statistics.average_size_mb.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">میانگین اندازه (MB)</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Lock className="w-8 h-8 text-red-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-red-600 mb-2">
                100%
              </div>
              <div className="text-sm text-gray-600">رمزگذاری شده</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="font-semibold mb-2">🔐 امنیت پشتیبان‌گیری:</div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>تمام پشتیبان‌ها با رمزگذاری AES-256-GCM محافظت می‌شوند</li>
            <li>رمز عبور شما در سرور ذخیره نمی‌شود</li>
            <li>فقط سوپر ادمین می‌تواند پشتیبان ایجاد و مدیریت کند</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Backup List */}
      {data && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                لیست پشتیبان‌ها
              </CardTitle>
              {data.backups.length > 12 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCleanupDialog(true)}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  پاک‌سازی قدیمی‌ها
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>هنوز پشتیبانی ایجاد نشده است</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.backups.map((backup) => (
                  <div key={backup.backup_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Lock className="w-6 h-6 text-blue-600" />
                      <div>
                        <div className="font-medium">{backup.backup_id}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(backup.created_at)} - {formatFileSize(backup.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadBackup(backup.backup_id)}
                    >
                      <Download className="w-4 h-4 ml-1" />
                      دانلود
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد پشتیبان جدید</DialogTitle>
          </DialogHeader>
          {creating ? (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-center text-sm">در حال ایجاد پشتیبان... {progress}%</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>رمز عبور</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل 8 کاراکتر"
                />
              </div>
              <div>
                <Label>تکرار رمز عبور</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleCreateBackup} disabled={creating}>
              ایجاد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Dialog */}
      <Dialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پاک‌سازی پشتیبان‌های قدیمی</DialogTitle>
          </DialogHeader>
          <p>پشتیبان‌های قدیمی‌تر از 12 ماه حذف خواهند شد.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCleanupDialog(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleCleanupBackups} disabled={cleaning}>
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMonthlyBackup;