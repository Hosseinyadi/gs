import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

interface Report {
  id: number;
  listing_id: number;
  listing_title: string;
  reporter_name: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'rejected';
  created_at: string;
}

const AdminReportsCenter = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getReports({ status: statusFilter });
      if (response.success && response.data) {
        setReports(response.data.reports || []);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری گزارش‌ها');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleAction = async (action: 'resolve' | 'reject') => {
    if (!selectedReport) return;

    try {
      const response = await adminApi.handleReport(selectedReport.id, {
        action,
        note: actionNote
      });

      if (response.success) {
        toast.success('گزارش بررسی و اقدام شد');
        setShowDialog(false);
        setSelectedReport(null);
        setActionNote('');
        loadReports();
      }
    } catch (error) {
      toast.error('خطا در پردازش گزارش');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'در انتظار' },
      reviewed: { variant: 'default', label: 'بررسی شده' },
      resolved: { variant: 'default', label: 'حل شده' },
      rejected: { variant: 'destructive', label: 'رد شده' }
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              مرکز گزارش‌های تخلف
            </CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="pending">در انتظار</option>
              <option value="reviewed">بررسی شده</option>
              <option value="resolved">حل شده</option>
              <option value="rejected">رد شده</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              گزارشی یافت نشد
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="border-r-4 border-r-orange-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{report.listing_title}</h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>گزارش‌دهنده:</strong> {report.reporter_name}</p>
                          <p><strong>دلیل:</strong> {report.reason}</p>
                          <p><strong>توضیحات:</strong> {report.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(report.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/listing/${report.listing_id}`, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {report.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowDialog(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReport(report);
                                setShowDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اقدام نسبت به گزارش</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>آیا می‌خواهید این گزارش را حل شده یا رد شده علامت بزنید؟</p>
            <div>
              <label className="text-sm font-medium">یادداشت (اختیاری):</label>
              <Textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="توضیحات اقدام انجام شده"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={() => handleAction('reject')}>
              رد گزارش
            </Button>
            <Button onClick={() => handleAction('resolve')}>
              حل شده
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReportsCenter;
