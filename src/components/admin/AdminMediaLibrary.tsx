import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Loader2, Trash2, Search, Image as ImageIcon, CheckSquare } from "lucide-react";

interface MediaFile {
  id: number;
  filename: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

const AdminMediaLibrary = () => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getMediaLibrary({ search: searchQuery });
      if (response.success && response.data) {
        setFiles(response.data.files || []);
      }
    } catch (error) {
      toast.error('خطا در بارگذاری فایل‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return;

    try {
      const response = await adminApi.deleteMediaFile(id);
      if (response.success) {
        setFiles(prev => prev.filter(f => f.id !== id));
        toast.success('فایل حذف شد');
      }
    } catch (error) {
      toast.error('خطا در حذف فایل');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) {
      toast.error('فایلی انتخاب نشده است');
      return;
    }

    if (!confirm(`آیا از حذف ${selectedFiles.length} فایل اطمینان دارید؟`)) return;

    try {
      const response = await adminApi.bulkDeleteMedia(selectedFiles);
      if (response.success) {
        setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)));
        setSelectedFiles([]);
        toast.success('فایل‌ها حذف شدند');
      }
    } catch (error) {
      toast.error('خطا در حذف فایل‌ها');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              کتابخانه رسانه ({files.length})
            </CardTitle>
            {selectedFiles.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 ml-2" />
                حذف {selectedFiles.length} فایل
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجوی فایل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadFiles()}
                className="pr-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              فایلی یافت نشد
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => toggleSelect(file.id)}
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-xs truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                  </div>
                  {selectedFiles.includes(file.id) && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.id);
                    }}
                    className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMediaLibrary;
