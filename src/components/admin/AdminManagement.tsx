import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus,
  Shield,
  Eye,
  Trash2,
  Activity,
  Crown,
  Users,
  Settings,
  Key,
  RefreshCw
} from "lucide-react";

interface Admin {
  id: number;
  username: string;
  email?: string;
  name?: string;
  role: string;
  is_super_admin: boolean;
  permissions: string[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  created_by_username?: string;
}

interface ActivityLog {
  id: number;
  admin_username: string;
  action: string;
  resource?: string;
  resource_id?: number;
  old_data?: any;
  new_data?: any;
  ip_address?: string;
  created_at: string;
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    role: 'moderator'
  });

  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/management/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
        if (showRefreshToast) {
          toast.success('لیست ادمین‌ها بروزرسانی شد');
        }
      } else {
        toast.error(data.error?.message || 'خطا در بارگذاری ادمین‌ها');
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      toast.error('خطا در بارگذاری ادمین‌ها');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/management/activity-log?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setActivityLogs(data.data.logs);
      } else {
        toast.error(data.error?.message || 'خطا در بارگذاری لاگ فعالیت‌ها');
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);
      toast.error('خطا در بارگذاری لاگ فعالیت‌ها');
    }
  };

  const handleCreateAdmin = async () => {
    try {
      if (!formData.username || !formData.password) {
        toast.error('نام کاربری و رمز عبور الزامی است');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('رمز عبور باید حداقل 6 کاراکتر باشد');
        return;
      }

      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/management/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('ادمین جدید با موفقیت ایجاد شد');
        setShowCreateDialog(false);
        loadAdmins();
        // Reset form
        setFormData({
          username: '',
          password: '',
          email: '',
          name: '',
          role: 'moderator'
        });
      } else {
        toast.error(data.error?.message || 'خطا در ایجاد ادمین');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('خطا در ایجاد ادمین');
    }
  };

  const handleToggleActive = async (adminId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/management/${adminId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(currentStatus ? 'ادمین غیرفعال شد' : 'ادمین فعال شد');
        loadAdmins();
      } else {
        toast.error(data.error?.message || 'خطا در تغییر وضعیت');
      }
    } catch (error) {
      console.error('Error toggling admin:', error);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteAdminId, setDeleteAdminId] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDeleteAdmin = async () => {
    if (!deleteAdminId || deleteConfirmText !== 'حذف') {
      toast.error('لطفاً کلمه "حذف" را برای تأیید وارد کنید');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/management/${deleteAdminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success('ادمین با موفقیت حذف شد');
        loadAdmins();
        setShowDeleteConfirm(false);
        setDeleteAdminId(null);
        setDeleteConfirmText('');
      } else {
        toast.error(data.error?.message || 'خطا در حذف ادمین');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('خطا در حذف ادمین');
    }
  };

  const openDeleteConfirm = (adminId: number) => {
    setDeleteAdminId(adminId);
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };

  const handleChangePassword = async () => {
    if (!selectedAdminId) return;

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('رمزهای عبور مطابقت ندارند');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('رمز عبور باید حداقل 6 کاراکتر باشد');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/management/${selectedAdminId}/change-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ new_password: passwordData.new_password })
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('رمز عبور با موفقیت تغییر کرد');
        setShowPasswordDialog(false);
        setPasswordData({ new_password: '', confirm_password: '' });
        setSelectedAdminId(null);
      } else {
        toast.error(data.error?.message || 'خطا در تغییر رمز عبور');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('خطا در تغییر رمز عبور');
    }
  };

  const getRoleBadge = (admin: Admin) => {
    if (admin.is_super_admin) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <Crown className="w-3 h-3" />
          مدیر اصلی
        </Badge>
      );
    }

    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      admin: { variant: 'secondary', label: 'مدیر', icon: Shield },
      moderator: { variant: 'outline', label: 'ناظر', icon: Eye },
      content_manager: { variant: 'outline', label: 'مدیر محتوا', icon: Shield },
      support: { variant: 'outline', label: 'پشتیبانی', icon: Shield }
    };

    const config = variants[admin.role] || variants.moderator;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-600" />
            مدیریت ادمین‌ها
          </h2>
          <p className="text-gray-600 mt-1">ایجاد و مدیریت کاربران ادمین سیستم</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadAdmins(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            بروزرسانی
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowActivityDialog(true);
              loadActivityLogs();
            }}
            className="flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            لاگ فعالیت‌ها
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                ایجاد ادمین
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد ادمین جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>نام کاربری *</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="admin_user"
                  />
                </div>
                <div>
                  <Label>رمز عبور *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="رمز عبور قوی"
                  />
                </div>
                <div>
                  <Label>نام</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="نام کامل"
                  />
                </div>
                <div>
                  <Label>ایمیل</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <Label>نقش</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({...formData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">ناظر (فقط تایید آگهی)</SelectItem>
                      <SelectItem value="content_manager">مدیر محتوا (مدیریت آگهی‌ها و دسته‌بندی‌ها)</SelectItem>
                      <SelectItem value="support">پشتیبانی (مشاهده اطلاعات)</SelectItem>
                      <SelectItem value="admin">مدیر (دسترسی کامل بجز مدیریت ادمین‌ها)</SelectItem>
                      <SelectItem value="super_admin">مدیر اصلی (دسترسی کامل)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateAdmin} className="w-full">
                  ایجاد ادمین
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست ادمین‌ها ({admins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام کاربری</TableHead>
                <TableHead>نام</TableHead>
                <TableHead>ایمیل</TableHead>
                <TableHead>نقش</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>آخرین ورود</TableHead>
                <TableHead>ایجاد شده توسط</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">{admin.username}</TableCell>
                  <TableCell>{admin.name || '-'}</TableCell>
                  <TableCell>{admin.email || '-'}</TableCell>
                  <TableCell>{getRoleBadge(admin)}</TableCell>
                  <TableCell>
                    <Badge variant={admin.is_active ? "default" : "secondary"}>
                      {admin.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {admin.last_login ? formatDate(admin.last_login) : 'هرگز'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {admin.created_by_username || 'سیستم'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAdminId(admin.id);
                          setShowPasswordDialog(true);
                        }}
                        disabled={admin.is_super_admin}
                        title="تغییر رمز عبور"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(admin.id, admin.is_active)}
                        disabled={admin.is_super_admin}
                        title={admin.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteConfirm(admin.id)}
                        disabled={admin.is_super_admin}
                        className="text-red-600 hover:text-red-700"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر رمز عبور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>رمز عبور جدید</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                placeholder="حداقل 6 کاراکتر"
              />
            </div>
            <div>
              <Label>تکرار رمز عبور</Label>
              <Input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                placeholder="تکرار رمز عبور"
              />
            </div>
            <Button onClick={handleChangePassword} className="w-full">
              تغییر رمز عبور
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              حذف ادمین
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">⚠️ هشدار: این عمل قابل بازگشت نیست!</p>
              <p className="text-red-600 text-sm mt-1">
                با حذف این ادمین، تمام دسترسی‌های او از بین خواهد رفت.
              </p>
            </div>
            <div>
              <Label>برای تأیید، کلمه <strong className="text-red-600">حذف</strong> را تایپ کنید:</Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="حذف"
                className="mt-2 text-center"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                انصراف
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAdmin}
                disabled={deleteConfirmText !== 'حذف'}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف ادمین
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>لاگ فعالیت‌های ادمین‌ها</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {activityLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold">{log.admin_username}</span>
                    <span className="mx-2">•</span>
                    <span className="text-blue-600">{log.action}</span>
                    {log.resource && (
                      <>
                        <span className="mx-2">در</span>
                        <span className="text-green-600">{log.resource}</span>
                      </>
                    )}
                    {log.resource_id && (
                      <span className="text-gray-500 text-sm"> (#{log.resource_id})</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </span>
                </div>
                {log.ip_address && (
                  <p className="text-xs text-gray-500">IP: {log.ip_address}</p>
                )}
              </div>
            ))}
            {activityLogs.length === 0 && (
              <p className="text-center text-gray-500 py-8">هیچ فعالیتی ثبت نشده است</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement;
