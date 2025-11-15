import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import apiService from "@/services/api";
import adminApi from "@/services/admin-api";
import {
  User,
  Ban,
  CheckCircle,
  Wallet,
  FileText,
  Search,
  Loader2,
  Calendar,
  Phone,
  Mail
} from "lucide-react";

interface UserData {
  id: number;
  phone: string;
  name?: string;
  email?: string;
  is_verified?: boolean;
  is_blocked?: boolean;
  wallet_balance?: number;
  created_at?: string;
  listings_count?: number;
  favorites_count?: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 20
      };

      if (searchQuery) params.search = searchQuery;

      const response = await apiService.getAdminUsers(params);
      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.total_pages);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('خطا در بارگذاری کاربران');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason.trim()) {
      toast.error('لطفاً دلیل مسدودسازی را وارد کنید');
      return;
    }

    try {
      const response = await adminApi.blockUser(selectedUser.id, blockReason);
      if (response.success) {
        setUsers(prev =>
          prev.map(user =>
            user.id === selectedUser.id ? { ...user, is_blocked: true } : user
          )
        );
        toast.success('کاربر مسدود شد');
        setShowBlockDialog(false);
        setSelectedUser(null);
        setBlockReason('');
      }
    } catch (error) {
      toast.error('خطا در مسدودسازی کاربر');
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await adminApi.unblockUser(userId);
      if (response.success) {
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, is_blocked: false } : user
          )
        );
        toast.success('مسدودیت کاربر رفع شد');
      }
    } catch (error) {
      toast.error('خطا در رفع مسدودیت کاربر');
    }
  };

  const handleAdjustWallet = async () => {
    if (!selectedUser || !walletAmount || !walletNote.trim()) {
      toast.error('لطفاً مبلغ و توضیحات را وارد کنید');
      return;
    }

    try {
      const response = await adminApi.adjustUserWallet(
        selectedUser.id,
        parseFloat(walletAmount),
        walletNote
      );
      if (response.success) {
        setUsers(prev =>
          prev.map(user =>
            user.id === selectedUser.id
              ? { ...user, wallet_balance: (user.wallet_balance || 0) + parseFloat(walletAmount) }
              : user
          )
        );
        toast.success('کیف پول به‌روزرسانی شد');
        setShowWalletDialog(false);
        setSelectedUser(null);
        setWalletAmount('');
        setWalletNote('');
      }
    } catch (error) {
      toast.error('خطا در تنظیم کیف پول');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجو بر اساس نام، شماره تلفن یا ایمیل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button onClick={loadUsers} variant="outline">
              <Search className="w-4 h-4 ml-2" />
              جستجو
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست کاربران ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              کاربری یافت نشد
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-right p-4">کاربر</th>
                    <th className="text-right p-4">تماس</th>
                    <th className="text-right p-4">آگهی‌ها</th>
                    <th className="text-right p-4">کیف پول</th>
                    <th className="text-right p-4">وضعیت</th>
                    <th className="text-right p-4">تاریخ عضویت</th>
                    <th className="text-right p-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{user.name || 'بدون نام'}</p>
                            {user.email && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4 text-gray-400" />
                            {user.listings_count || 0}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.favorites_count || 0} علاقه‌مندی
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">
                          {formatPrice(user.wallet_balance || 0)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {user.is_verified && (
                            <Badge variant="default">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              تایید شده
                            </Badge>
                          )}
                          {user.is_blocked && (
                            <Badge variant="destructive">
                              <Ban className="w-3 h-3 ml-1" />
                              مسدود
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(user.created_at)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowWalletDialog(true);
                            }}
                            title="تنظیم کیف پول"
                          >
                            <Wallet className="w-4 h-4" />
                          </Button>
                          {user.is_blocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnblockUser(user.id)}
                              title="رفع مسدودیت"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowBlockDialog(true);
                              }}
                              title="مسدودسازی"
                            >
                              <Ban className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                قبلی
              </Button>
              <span className="px-4 py-2">
                صفحه {currentPage} از {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                بعدی
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Dialog */}
      <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تنظیم کیف پول کاربر</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">کاربر: {selectedUser.name}</p>
                <p className="text-sm text-gray-600">
                  موجودی فعلی: {formatPrice(selectedUser.wallet_balance || 0)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">مبلغ (تومان):</label>
                <Input
                  type="number"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  placeholder="مبلغ مثبت برای افزایش، منفی برای کاهش"
                />
                <p className="text-xs text-gray-500 mt-1">
                  برای افزودن مبلغ مثبت و برای کسر مبلغ منفی وارد کنید
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">توضیحات:</label>
                <Input
                  value={walletNote}
                  onChange={(e) => setWalletNote(e.target.value)}
                  placeholder="دلیل تغییر موجودی"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWalletDialog(false)}>
              انصراف
            </Button>
            <Button onClick={handleAdjustWallet}>
              تأیید
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مسدودسازی کاربر</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <p>آیا از مسدودسازی کاربر <strong>{selectedUser.name}</strong> اطمینان دارید؟</p>
              <div>
                <label className="text-sm font-medium">دلیل مسدودسازی:</label>
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="دلیل مسدودسازی را وارد کنید"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={handleBlockUser}>
              مسدود کردن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
