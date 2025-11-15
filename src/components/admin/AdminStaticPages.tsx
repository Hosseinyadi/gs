import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import adminApi from "@/services/admin-api";
import { Save, Loader2, FileText } from "lucide-react";

const AdminStaticPages = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState({
    about: { title: '', content: '' },
    terms: { title: '', content: '' },
    contact: { title: '', content: '' },
    privacy: { title: '', content: '' }
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getStaticPages();
      if (response.success && response.data?.pages) {
        // Convert array to object
        const pagesObj: any = {};
        response.data.pages.forEach((page: any) => {
          pagesObj[page.slug] = {
            title: page.title,
            content: page.content,
            meta_title: page.meta_title,
            meta_description: page.meta_description
          };
        });
        setPages(pagesObj);
      } else {
        toast.error(response.message || 'خطا در بارگذاری صفحات');
      }
    } catch (error) {
      console.error('Error loading static pages:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pageKey: string) => {
    setSaving(true);
    const toastId = toast.loading('در حال ذخیره صفحه...');
    
    try {
      const response = await adminApi.updateStaticPage(pageKey, pages[pageKey as keyof typeof pages]);
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('صفحه با موفقیت ذخیره شد');
        await loadPages(); // بارگذاری مجدد صفحات
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ذخیره صفحه');
      }
    } catch (error) {
      console.error('Error saving static page:', error);
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600">در حال بارگذاری صفحات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            مدیریت صفحات استاتیک
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="about">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="about">درباره ما</TabsTrigger>
              <TabsTrigger value="terms">قوانین</TabsTrigger>
              <TabsTrigger value="contact">تماس با ما</TabsTrigger>
              <TabsTrigger value="privacy">حریم خصوصی</TabsTrigger>
            </TabsList>

            {Object.entries(pages).map(([key, page]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">عنوان صفحه</label>
                  <Input
                    value={page.title}
                    onChange={(e) => setPages({
                      ...pages,
                      [key]: { ...page, title: e.target.value }
                    })}
                    placeholder="عنوان صفحه"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">محتوای صفحه</label>
                  <Textarea
                    value={page.content}
                    onChange={(e) => setPages({
                      ...pages,
                      [key]: { ...page, content: e.target.value }
                    })}
                    placeholder="محتوای صفحه (HTML پشتیبانی می‌شود)"
                    rows={15}
                  />
                </div>

                <Button onClick={() => handleSave(key)} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      ذخیره صفحه
                    </>
                  )}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStaticPages;
