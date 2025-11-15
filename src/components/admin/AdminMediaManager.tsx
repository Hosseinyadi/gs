import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Loader2, ArrowRight, Trash2, MoveUp, MoveDown, Image as ImageIcon } from "lucide-react";

const AdminMediaManager = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [listingTitle, setListingTitle] = useState('');

  useEffect(() => {
    loadImages();
  }, [id]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getListingImages(parseInt(id!));
      if (response.success && response.data) {
        setImages(response.data.images || []);
        setListingTitle(response.data.title || '');
      }
    } catch (error) {
      toast.error('خطا در بارگذاری تصاویر');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('آیا از حذف این تصویر اطمینان دارید؟')) return;

    try {
      const response = await adminApi.deleteListingImage(parseInt(id!), index);
      if (response.success) {
        setImages(prev => prev.filter((_, i) => i !== index));
        toast.success('تصویر با موفقیت حذف شد');
      }
    } catch (error) {
      toast.error('خطا در حذف تصویر');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    try {
      const response = await adminApi.reorderListingImages(parseInt(id!), index, index - 1);
      if (response.success) {
        const newImages = [...images];
        [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
        setImages(newImages);
        toast.success('تصویر جابه‌جا شد');
      }
    } catch (error) {
      toast.error('خطا در جابه‌جایی تصویر');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1) return;

    try {
      const response = await adminApi.reorderListingImages(parseInt(id!), index, index + 1);
      if (response.success) {
        const newImages = [...images];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        setImages(newImages);
        toast.success('تصویر جابه‌جا شد');
      }
    } catch (error) {
      toast.error('خطا در جابه‌جایی تصویر');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت رسانه‌های آگهی</h1>
          <p className="text-gray-600 mt-1">{listingTitle}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          بازگشت
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            گالری تصاویر ({images.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>تصویری برای این آگهی وجود ندارد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={img}
                      alt={`تصویر ${index + 1}`}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      #{index + 1}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="flex-1"
                        title="انتقال به بالا"
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === images.length - 1}
                        className="flex-1"
                        title="انتقال به پایین"
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(index)}
                        className="flex-1"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMediaManager;
