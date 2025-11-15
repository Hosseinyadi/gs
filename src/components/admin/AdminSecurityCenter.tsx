import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Loader2, Shield, Ban, CheckCircle, AlertTriangle } from "lucide-react";

interface BlockedIP {
  id: number;
  ip_address: string;
  reason: string;
  blocked_at: string;
}

interface LoginLog {
  id: number;
  username: string;
  ip_address: string;
  success: boolean;
  created_at: string;
}

const AdminSecurityCenter = () => {
  const [loading, setLoading] = useState(false);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [newIP, setNewIP] = useState('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ipsRes, logsRes] = await Promise.all([
        adminApi.getBlockedIPs(),
        adminApi.getLoginLogs({ limit: 50 })
      ]);

      if (ipsRes.success) setBlockedIPs(ipsRes.data?.ips || []);
      if (logsRes.success) setLoginLogs(logsRes.data?.logs || []);
    } catch (error) {
      toast.error('خطا در بارگذاری داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP || !blockReason) {
      toast.error('IP و دلیل بلاک الزامی است');
      return;
    }

    try {
      const response = await adminApi.blockIP(newIP, blockReason);
      if (response.success) {
        toast.success('IP بلاک شد');
        setNewIP('');
        setBlockReason('');
        loadData();
      }
    } catch (error) {
      toast.error('خطا در بلاک IP');
    }
  };

  const handleUnblockIP = async (id: number) => {
    try {
      const response = await adminApi.unblockIP(id);
      if (response.success) {
        toast.success('IP آنبلاک شد');
        loadData();
      }
    } catch (error) {
      toast.error('خطا در آنبلاک IP');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            مرکز امنیت
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="blocked-ips">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blocked-ips">IP های بلاک شده</TabsTrigger>
              <TabsTrigger value="login-logs">لاگ‌های ورود</TabsTrigger>
            </TabsList>

            <TabsContent value="blocked-ips" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">بلاک IP جدید</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="آدرس IP (مثال: 192.168.1.1)"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                    <Input
                      placeholder="دلیل بلاک"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                    <Button onClick={handleBlockIP}>
                      <Ban className="w-4 h-4 ml-2" />
                      بلاک کردن
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : blockedIPs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  IP بلاک شده‌ای وجود ندارد
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedIPs.map((ip) => (
                    <Card key={ip.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-mono font-bold">{ip.ip_address}</p>
                          <p className="text-sm text-gray-600">{ip.reason}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(ip.blocked_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblockIP(ip.id)}
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          آنبلاک
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="login-logs">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : loginLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لاگی یافت نشد
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-right p-4">کاربر</th>
                        <th className="text-right p-4">IP</th>
                        <th className="text-right p-4">وضعیت</th>
                        <th className="text-right p-4">زمان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-gray-50">
                          <td className="p-4">{log.username}</td>
                          <td className="p-4 font-mono">{log.ip_address}</td>
                          <td className="p-4">
                            {log.success ? (
                              <Badge variant="default">
                                <CheckCircle className="w-3 h-3 ml-1" />
                                موفق
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertTriangle className="w-3 h-3 ml-1" />
                                ناموفق
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-sm">
                            {new Date(log.created_at).toLocaleString('fa-IR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurityCenter;
