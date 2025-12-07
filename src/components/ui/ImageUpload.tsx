import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  minImages?: number;
  required?: boolean;
}

const ImageUpload = ({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  minImages = 1,
  required = true 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // چک کردن تعداد عکس‌ها
    if (images.length + files.length > maxImages) {
      toast.error(`حداکثر ${maxImages} عکس می‌توانید آپلود کنید`);
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // چک کردن نوع فایل
        if (!file.type.startsWith('image/')) {
          toast.error(`فایل ${file.name} یک تصویر نیست`);
          continue;
        }

        // چک کردن حجم فایل (حداکثر 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`حجم فایل ${file.name} بیش از 5MB است`);
          continue;
        }

        // تبدیل به Base64
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast.success(`${newImages.length} عکس با موفقیت اضافه شد`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('خطا در آپلود تصویر');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast.success('عکس حذف شد');
  };

  const canAddMore = images.length < maxImages;
  const hasMinimum = images.length >= minImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium block mb-1">
            تصاویر آگهی {required && <span className="text-red-500">*</span>}
          </label>
          <p className="text-xs text-muted-foreground">
            حداقل {minImages} و حداکثر {maxImages} عکس • حداکثر حجم هر عکس: 5MB
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {images.length} / {maxImages}
        </div>
      </div>

      {/* Grid نمایش عکس‌ها */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`تصویر ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="حذف عکس"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  عکس اصلی
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* دکمه آپلود */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-primary"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span>در حال آپلود...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm">
                  {images.length === 0 ? 'آپلود تصاویر' : 'افزودن تصویر بیشتر'}
                </span>
                <span className="text-xs text-muted-foreground">
                  می‌توانید چند عکس را همزمان انتخاب کنید
                </span>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* پیام هشدار */}
      {!hasMinimum && required && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span>لطفاً حداقل {minImages} عکس آپلود کنید</span>
        </div>
      )}

      {/* راهنما */}
      {images.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">نکات مهم برای آپلود تصویر:</p>
              <ul className="space-y-1 text-xs">
                <li>• اولین عکس به عنوان عکس اصلی آگهی نمایش داده می‌شود</li>
                <li>• از تصاویر با کیفیت و واضح استفاده کنید</li>
                <li>• تصاویر از زوایای مختلف محصول را آپلود کنید</li>
                <li>• فرمت‌های مجاز: JPG, PNG, WEBP</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
