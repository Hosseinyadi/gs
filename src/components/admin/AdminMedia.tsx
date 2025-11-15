import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image, Upload, Trash2, Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MediaFile {
  id: number;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadDate: string;
}

const AdminMedia = () => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    const toastId = toast.loading('در حال آپلود فایل‌ها...');

    try {
      const uploadedFiles: MediaFile[] = [];
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // بررسی نوع فایل
        if (!file.type.startsWith('image/')) {
          toast.error(`فایل ${file.name} یک تصویر نیست`);
          continue;
        }

        // بررسی حجم فایل (حداکثر 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`حجم فایل ${file.name} بیش از 5MB است`);
          continue;
        }

        // تبدیل فایل به Base64 برای پیش‌نمایش
        const reader = new FileReader();
        const fileUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const newFile: MediaFile = {
          id: Date.now() + i,
          name: file.name,
          size: formatFileSize(file.size),
          type: 'image',
          url: fileUrl,
          uploadDate: new Date().toLocaleDateString('fa-IR')
        };

        uploadedFiles.push(newFile);
      }

      setFiles(prev => [...uploadedFiles, ...prev]);
      toast.dismiss(toastId);
      toast.success(`${uploadedFiles.length} فایل با موفقیت آپلود شد`);
      
      // پاک کردن input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.dismiss(toastId);
      toast.error('خطا در آپلود فایل‌ها');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (id: number) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return;
    setFiles(files.filter(f => f.id !== id));
    toast.success('فایل حذف شد');
  };

  const handleView = (url: string) => {
    setPreviewImage(url);
  };

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('دانلود فایل آغاز شد');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Image className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-bold">مدیریت رسانه</h2>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>آپلود فایل جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onClick={handleUploadClick}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary', 'bg-primary/5');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
              const files = e.dataTransfer.files;
              if (files.length > 0 && fileInputRef.current) {
                fileInputRef.current.files = files;
                handleFileSelect({ target: { files } } as any);
              }
            }}
          >
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-gray-600 mb-4">در حال آپلود فایل‌ها...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">فایل‌های خود را اینجا بکشید یا کلیک کنید</p>
                <Button type="button" disabled={uploading}>
                  <Upload className="w-4 h-4 ml-2" />
                  انتخاب فایل
                </Button>
                <p className="text-xs text-gray-500 mt-3">حداکثر حجم: 5MB | فرمت‌های مجاز: JPG, PNG, GIF, WEBP</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      <Card>
        <CardHeader>
          <CardTitle>فایل‌های آپلود شده</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>هنوز فایلی آپلود نشده است</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                    <img 
                      src={file.url} 
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }}
                    />
                  </div>
                  <h4 className="font-medium truncate" title={file.name}>{file.name}</h4>
                  <p className="text-sm text-gray-500">{file.size} • {file.uploadDate}</p>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleView(file.url)}
                      title="مشاهده"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownload(file)}
                      title="دانلود"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(file.id)}
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش تصویر</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img 
              src={previewImage || ''} 
              alt="Preview" 
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMedia;
