import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star, MessageSquare, ThumbsUp, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import apiService from "@/services/api";

interface Review {
  id: number;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  admin_response?: string;
  created_at: string;
  user_name: string;
  user_avatar?: string;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
}

interface ReviewsSectionProps {
  listingId: number;
  listingOwnerId?: number;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ listingId, listingOwnerId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadReviews();
  }, [listingId, sortBy]);

  const loadReviews = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      
      const response = await apiService.request(`/reviews/listing/${listingId}?page=${pageNum}&limit=10&sort=${sortBy}`);
      
      if (response.success) {
        if (pageNum === 1) {
          setReviews(response.data.reviews);
        } else {
          setReviews(prev => [...prev, ...response.data.reviews]);
        }
        
        setStats(response.data.statistics);
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

  const handleAddReview = async () => {
    if (!user) {
      toast.error('برای ثبت نظر باید وارد شوید');
      return;
    }

    if (!newComment.trim()) {
      toast.error('لطفاً نظر خود را بنویسید');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.request('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: listingId,
          rating: newRating,
          comment: newComment.trim()
        })
      });

      if (response.success) {
        toast.success('نظر شما با موفقیت ثبت شد');
        setShowAddDialog(false);
        setNewComment('');
        setNewRating(5);
        loadReviews(1); // Reload reviews
      } else {
        toast.error(response.message || 'خطا در ثبت نظر');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${
              interactive ? 'cursor-pointer hover:text-yellow-400' : ''
            }`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canAddReview = user && user.id !== listingOwnerId;
  const userHasReviewed = reviews.some(review => review.user_name === user?.name);

  if (loading && page === 1) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      {stats && stats.total_reviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              نظرات و امتیازات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Overall Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stats.average_rating.toFixed(1)}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.average_rating))}
                </div>
                <p className="text-gray-600">
                  بر اساس {stats.total_reviews} نظر
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {stats.rating_distribution.map((dist) => (
                  <div key={dist.rating} className="flex items-center gap-3">
                    <span className="text-sm w-8">{dist.rating} ⭐</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${dist.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">
                      {dist.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              نظرات کاربران
              {stats && (
                <Badge variant="secondary">
                  {stats.total_reviews}
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex gap-2">
              {/* Sort Options */}
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="newest">جدیدترین</option>
                <option value="oldest">قدیمی‌ترین</option>
                <option value="highest">بالاترین امتیاز</option>
                <option value="lowest">پایین‌ترین امتیاز</option>
              </select>
              
              {/* Add Review Button */}
              {canAddReview && !userHasReviewed && (
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  ثبت نظر
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>هنوز نظری ثبت نشده است</p>
              {canAddReview && (
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="mt-4"
                >
                  اولین نظر را ثبت کنید
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
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
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
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

      {/* Add Review Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ثبت نظر جدید</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                امتیاز شما
              </label>
              <div className="flex justify-center">
                {renderStars(newRating, true, setNewRating)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                نظر شما
              </label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="نظر خود را در مورد این آگهی بنویسید..."
                rows={4}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">
                {newComment.length}/1000 کاراکتر
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              disabled={submitting}
            >
              انصراف
            </Button>
            <Button 
              onClick={handleAddReview}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsSection;