import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Award, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  User,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";
import TrustBadge from "@/components/ui/TrustBadge";

interface TrustStats {
  total_verified: number;
  total_listings: number;
  verified_featured: number;
}

interface TrustAction {
  action: 'granted' | 'revoked';
  reason: string;
  created_at: string;
  listing_title: string;
  admin_name: string;
}

interface TrustBadgeData {
  statistics: TrustStats;
  recent_actions: TrustAction[];
}

const AdminTrustBadge = () => {
  const [data, setData] = useState<TrustBadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTrustBadgeData();
  }, []);

  const loadTrustBadgeData = async () => {
    try {
      setLoading(true);
      const response = await apiService.request('/admin/trust-badge/stats');
      
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error loading trust badge data:', error);
      toast.error('خطا در بارگذاری اطلاعات نماد اعتماد');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantTrustBadge = async () => {
    if (!selectedListing) return;

    setSubmitting(true);
    try {
      const response = await apiService.request(`/admin/listings/${selectedListing.id}/trust-badge`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      if (response.success) {
        toast.success('نماد اعتماد با موفقیت اعطا شد');
        setShowGrantDialog(false);
        setReason('');
        setSelectedListing(null);
        loadTrustBadgeData();
      } else {
        toast.error(response.message || 'خطا در اعطای نماد اعتماد');
      }
    } catch (error) {
      console.error('Error granting trust badge:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeTrustBadge = async () => {
    if (!selectedListing) return;

    setSubmitting(true);
    try {
      const response = await apiService.request(`/admin/listings/${selectedListing.id}/trust-badge`, {
        method: 'DELETE',
        body: JSON.stringify({ reason })
      });

      if (response.success) {
        toast.success('نماد اعتماد با موفقیت لغو شد');
        setShowRevokeDialog(false);
        setReason('');
        setSelectedListing(null);
        loadTrustBadgeData();
      } else {
        toast.error(response.message || 'خطا در لغو نماد اعتماد');
      }
    } catch (error) {
      console.error('Error revoking trust badge:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
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

  const getActionIcon = (action: string) => {
    return action === 'granted' ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getActionText = (action: string) => {
    return action === 'granted' ? 'اعطا شد' : 'لغو شد';
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
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">مدیریت نماد اعتماد</h1>
            <p className="text-gray-600">مدیریت نماد اعتماد آگهی‌ها (فقط سوپر ادمین)</p>
          </div>
        </div>
        <TrustBadge isVerified={true} variant="full" size="lg" />
      </div>

      {/* Statistics Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {data.statistics.total_verified}
              </div>
              <div className="text-sm text-gray-600">آگهی‌های دارای نماد اعتماد</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {data.statistics.verified_featured}
              </div>
              <div className="text-sm text-gray-600">آگهی‌های ویژه با نماد اعتماد</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round((data.statistics.total_verified / data.statistics.total_listings) * 100)}%
              </div>
              <div className="text-sm text-gray-600">درصد آگهی‌های دارای نماد اعتماد</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Important Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="font-semibold mb-2">نکات مهم نماد اعتماد:</div>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>فقط سوپر ادمین می‌تواند نماد اعتماد اعطا یا لغو کند</li>
            <li>نماد اعتماد نشان‌دهنده تایید کیفیت و اعتبار آگهی توسط مدیریت سایت است</li>
            <li>آگهی‌های دارای نماد اعتماد در نتایج جستجو اولویت بالاتری دارند</li>
            <li>تمام اقدامات مربوط به نماد اعتماد در سیستم ثبت می‌شود</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Recent Actions */}
      {data && data.recent_actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              آخرین فعالیت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent_actions.map((action, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(action.action)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{action.listing_title}</span>
                      <Badge variant={action.action === 'granted' ? 'default' : 'destructive'}>
                        {getActionText(action.action)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {action.admin_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(action.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    {action.reason && (
                      <div className="text-sm text-gray-700 bg-gray-50 rounded p-2">
                        <strong>دلیل:</strong> {action.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grant Trust Badge Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              اعطای نماد اعتماد
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedListing && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium mb-1">آگهی انتخاب شده:</div>
                <div className="text-sm text-gray-700">{selectedListing.title}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                دلیل اعطای نماد اعتماد
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="دلیل اعطای نماد اعتماد را بنویسید..."
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {reason.length}/500 کاراکتر
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowGrantDialog(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button 
              onClick={handleGrantTrustBadge}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'در حال اعطا...' : 'اعطای نماد اعتماد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Trust Badge Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              لغو نماد اعتماد
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedListing && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="font-medium mb-1 text-red-800">آگهی انتخاب شده:</div>
                <div className="text-sm text-red-700">{selectedListing.title}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                دلیل لغو نماد اعتماد
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="دلیل لغو نماد اعتماد را بنویسید..."
                rows={3}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {reason.length}/500 کاراکتر
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRevokeDialog(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button 
              onClick={handleRevokeTrustBadge}
              disabled={submitting}
              variant="destructive"
            >
              {submitting ? 'در حال لغو...' : 'لغو نماد اعتماد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrustBadge;