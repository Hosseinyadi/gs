import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Ban,
  CheckCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Activity,
  FileText,
  Trash2,
  Download
} from "lucide-react";

interface LoginAttempt {
  id: number;
  ip_address: string;
  user_agent: string;
  phone?: string;
  username?: string;
  success: boolean;
  created_at: string;
}

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at?: string;
}

interface SecuritySettings {
  max_login_attempts: number;
  lockout_duration: number;
  session_timeout: number;
  require_strong_password: boolean;
  enable_2fa: boolean;
  log_all_actions: boolean;
  block_suspicious_ips: boolean;
}

const AdminSecurity = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SecuritySettings>({
    max_login_attempts: 5,
    lockout_duration: 30,
    session_timeout: 60,
    require_strong_password: true,
    enable_2fa: false,
    log_all_actions: true,
    block_suspicious_ips: true
  });
  const [newBlockIP, setNewBlockIP] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Load login attempts
      const attemptsRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/security/login-attempts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const attemptsData = await attemptsRes.json();
      if (attemptsData.success) {
        setLoginAttempts(attemptsData.data || []);
      }

      // Load blocked IPs
      const blockedRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/security/blocked-ips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blockedData = await blockedRes.json();
      if (blockedData.success) {
        setBlockedIPs(blockedData.data || []);
      }

      // Load settings
      const settingsRes = await fetch(`${import.meta.env.VITE_API_URL}/admin/security/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.data) {
        setSettings(prev => ({ ...prev, ...settingsData.data }));
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newBlockIP.trim()) {
      toast.error('آدرس IP الزامی است');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/security/block-ip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ip_address: newBlockIP,
          reason: blockReason || 'مسدود شده توسط ادمین'
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('IP با موفقیت مسدود شد');
        setNewBlockIP('');
        setBlockReason('');
        loadSecurityData();
      } else {
        toast.error(data.error?.message || 'خطا در مسدود کردن IP');
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const handleUnblockIP = async (id: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/security/unblock-ip/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('IP از لیست مسدودی حذف شد');
        loadSecurityData();
      } else {
        toast.error(data.error?.message || 'خطا در رفع مسدودیت');
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/security/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('تنظیمات امنیتی ذخیره شد');
      } else {
        toast.error(data.error?.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      toast.error('خطا در ارتباط با سرور');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  // Calculate security stats
  const failedAttempts = loginAttempts.filter(a => !a.success).length;
  const successfulAttempts = loginAttempts.filter(a => a.success).length;
  const uniqueIPs = new Set(loginAttempts.map(a => a.ip_address)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-rose-600" />
          <h2 className="text-2xl font-bold">مرکز امنیت</h2>
        </div>
        <Button onClick={loadSecurityData} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="attempts">تلاش‌های ورود</TabsTrigger>
          <TabsTrigger value="blocked">IP های مسدود</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">تلاش‌های ناموفق</p>
                    <p className="text-3xl font-bold text-red-600">{failedAttempts}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ورودهای موفق</p>
                    <p className="text-3xl font-bold text-green-600">{successfulAttempts}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">IP های یکتا</p>
                    <p className="text-3xl font-bold text-blue-600">{uniqueIPs}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">IP های مسدود</p>
                    <p className="text-3xl font-bold text-orange-600">{blockedIPs.length}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Ban className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle>وضعیت امنیتی سیستم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium">رمزنگاری SSL</p>
                    <p className="text-sm text-gray-600">فعال</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium">محافظت CSRF</p>
                    <p className="text-sm text-gray-600">فعال</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-sm text-gray-600">فعال</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>آخرین فعالیت‌های امنیتی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loginAttempts.slice(0, 5).map((attempt) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {attempt.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {attempt.phone || attempt.username || 'ناشناس'}
                        </p>
                        <p className="text-sm text-gray-500">{attempt.ip_address}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant={attempt.success ? "default" : "destructive"}>
                        {attempt.success ? 'موفق' : 'ناموفق'}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(attempt.created_at)}</p>
                    </div>
                  </div>
                ))}
                {loginAttempts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">فعالیتی ثبت نشده</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Attempts Tab */}
        <TabsContent value="attempts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>تلاش‌های ورود ({loginAttempts.length})</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 ml-2" />
                  خروجی
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loginAttempts.map((attempt) => (
                  <div key={attempt.id} className={`p-4 border rounded-lg ${!attempt.success ? 'border-red-200 bg-red-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getDeviceIcon(attempt.user_agent)}
                        <div>
                          <p className="font-medium">
                            {attempt.phone || attempt.username || 'ناشناس'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Globe className="w-3 h-3" />
                            {attempt.ip_address}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <Badge variant={attempt.success ? "default" : "destructive"}>
                          {attempt.success ? 'ورود موفق' : 'ورود ناموفق'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 inline ml-1" />
                          {formatDate(attempt.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 truncate">{attempt.user_agent}</p>
                  </div>
                ))}
                {loginAttempts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">تلاش ورودی ثبت نشده</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked IPs Tab */}
        <TabsContent value="blocked" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>مسدود کردن IP جدید</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="آدرس IP (مثال: 192.168.1.1)"
                  value={newBlockIP}
                  onChange={(e) => setNewBlockIP(e.target.value)}
                />
                <Input
                  placeholder="دلیل مسدودسازی"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
                <Button onClick={handleBlockIP}>
                  <Ban className="w-4 h-4 ml-2" />
                  مسدود کردن
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IP های مسدود شده ({blockedIPs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {blockedIPs.map((ip) => (
                  <div key={ip.id} className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-mono font-bold">{ip.ip_address}</p>
                      <p className="text-sm text-gray-600">{ip.reason}</p>
                      <p className="text-xs text-gray-500">
                        مسدود شده در: {formatDate(ip.blocked_at)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblockIP(ip.id)}
                    >
                      <CheckCircle className="w-4 h-4 ml-2" />
                      رفع مسدودیت
                    </Button>
                  </div>
                ))}
                {blockedIPs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">هیچ IP مسدودی وجود ندارد</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تنظیمات امنیتی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>حداکثر تلاش ورود ناموفق</Label>
                  <Input
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      max_login_attempts: parseInt(e.target.value) || 5
                    }))}
                    min={1}
                    max={10}
                  />
                  <p className="text-xs text-gray-500">بعد از این تعداد، حساب قفل می‌شود</p>
                </div>

                <div className="space-y-2">
                  <Label>مدت قفل شدن (دقیقه)</Label>
                  <Input
                    type="number"
                    value={settings.lockout_duration}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      lockout_duration: parseInt(e.target.value) || 30
                    }))}
                    min={5}
                    max={120}
                  />
                  <p className="text-xs text-gray-500">مدت زمان قفل بودن حساب</p>
                </div>

                <div className="space-y-2">
                  <Label>زمان انقضای نشست (دقیقه)</Label>
                  <Input
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      session_timeout: parseInt(e.target.value) || 60
                    }))}
                    min={15}
                    max={480}
                  />
                  <p className="text-xs text-gray-500">بعد از این مدت، کاربر باید دوباره وارد شود</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>الزام رمز عبور قوی</Label>
                    <p className="text-xs text-gray-500">حداقل 8 کاراکتر با حروف و اعداد</p>
                  </div>
                  <Switch
                    checked={settings.require_strong_password}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      require_strong_password: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>ثبت تمام فعالیت‌ها</Label>
                    <p className="text-xs text-gray-500">ذخیره لاگ تمام عملیات ادمین‌ها</p>
                  </div>
                  <Switch
                    checked={settings.log_all_actions}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      log_all_actions: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>مسدودسازی خودکار IP مشکوک</Label>
                    <p className="text-xs text-gray-500">IP هایی که تلاش‌های ناموفق زیادی دارند</p>
                  </div>
                  <Switch
                    checked={settings.block_suspicious_ips}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      block_suspicious_ips: checked
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700">
                  <Lock className="w-4 h-4 ml-2" />
                  ذخیره تنظیمات امنیتی
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurity;
