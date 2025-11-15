import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Star, 
  MessageSquare, 
  Check, 
  X, 
  Reply, 
  Eye,
  Filter,
  Search,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";

interface Review {
  id: number;
  listing_id: number;
  listing_title: string;
  user_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_verified_purchase: boolean;
  admin_response?: string;
  created_at: string;
  updated_at?: string;
}

interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  average_rating: number;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [filter, searchTerm]);

  const loadReviews = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        status: filter,
        search: searchTerm
      });

      const response = await apiService.request(`/admin/reviews?${params}`);
      
      if (response.success) {
        if (pageNum === 1) {
          setReviews(response.data.reviews);
        } else {
          setReviews(prev => [...prev, ...response.data.reviews]);
        }
        
        setHasMore(pageNum < response.data.pagination.total_pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('خطا در بارگذاری نظرات');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.request('/admin/reviews/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApproveReview = async (reviewId: number, approve: boolean) => {
    try {
      const response = await apiService.request(`/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ approve })
      });

      if (response.success) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, is_approved: approve }
            : review
        ));
        
        toast.success(approve ? 'نظر تایید شد' : 'نظر رد شد');
        loadStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('خطا در به‌روزرسانی نظر');
    }
  };

  const handleAddResponse = async () => {
    if (!selectedReview || !adminResponse.trim()) return;

    setSubmitting(true);
    try {
      const response = await apiService.request(`/admin/reviews/${selectedReview.id}/response`, {
        method: 'PUT',
        body: JSON.stringify({ response: adminResponse.trim() })
      });

      if (response.success) {
        setReviews(prev => prev.map(review => 
          review.id === selectedReview.id 
            ? { ...review, admin_response: adminResponse.trim() }
            : review
        ));
        
        setShowResponseDialog(false);
        setAdminResponse('');
        setSelectedReview(null);
        toast.success('پاسخ ثبت شد');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('خطا در ثبت پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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

  const getStatusBadge = (review: Review) => {
    if (review.is_approved) {
      return <Badge className="bg-green-100 text-green-800">تایید شده</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">در انتظار تایید</Badge>;
    }
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">کل نظرات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">در انتظار</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">تایید شده</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-600">رد شده</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">میانگین امتیاز</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                همه
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                در انتظار
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                تایید شده
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                رد شده
              </Button>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="جستجو در نظرات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            مدیریت نظرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>نظری یافت نشد</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {review.user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{review.user_name}</h4>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              خرید تایید شده
                            </Badge>
                          )}
                          {getStatusBadge(review)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span>آگهی: {review.listing_title}</span>
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-600">
                            ({review.rating} از 5)
                          </span>
                        </div>
                        
                        {review.comment && (
                          <p className="text-gray-700 leading-relaxed mb-3">
                            {review.comment}
                          </p>
                        )}
                        
                        {review.admin_response && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-blue-600">
                                پاسخ مدیریت
                              </Badge>
                            </div>
                            <p className="text-blue-800 text-sm">
                              {review.admin_response}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    {!review.is_approved && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveReview(review.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 ml-1" />
                        تایید
                      </Button>
                    )}
                    
                    {review.is_approved && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApproveReview(review.id, false)}
                      >
                        <X className="w-4 h-4 ml-1" />
                        رد
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReview(review);
                        setAdminResponse(review.admin_response || '');
                        setShowResponseDialog(true);
                      }}
                    >
                      <Reply className="w-4 h-4 ml-1" />
                      {review.admin_response ? 'ویرایش پاسخ' : 'پاسخ'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/listing/${review.listing_id}`, '_blank')}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      مشاهده آگهی
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => loadReviews(page + 1)}
                    disabled={loading}
                  >
                    {loading ? 'در حال بارگذاری...' : 'نمایش بیشتر'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedReview?.admin_response ? 'ویرایش پاسخ' : 'پاسخ به نظر'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedReview && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">نظر کاربر:</div>
                <p className="text-sm">{selectedReview.comment}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">
                پاسخ مدیریت
              </label>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {adminResponse.length}/500 کاراکتر
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowResponseDialog(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button 
              onClick={handleAddResponse}
              disabled={submitting || !adminResponse.trim()}
            >
              {submitting ? 'در حال ثبت...' : 'ثبت پاسخ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;