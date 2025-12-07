import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, FileText, Eye, RefreshCw, Info, HelpCircle, ScrollText, BookOpen, Shield, Phone } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface StaticPage {
  id?: number;
  slug: string;
  title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_active: boolean;
}

const pageIcons: Record<string, any> = {
  about: Info,
  faq: HelpCircle,
  terms: ScrollText,
  help: BookOpen,
  privacy: Shield,
  contact: Phone,
};

const defaultPages: StaticPage[] = [
  { slug: 'about', title: 'درباره ما', content: '', meta_title: '', meta_description: '', is_active: true },
  { slug: 'faq', title: 'سوالات متداول', content: '', meta_title: '', meta_description: '', is_active: true },
  { slug: 'terms', title: 'قوانین و مقررات', content: '', meta_title: '', meta_description: '', is_active: true },
  { slug: 'help', title: 'راهنمای سایت', content: '', meta_title: '', meta_description: '', is_active: true },
  { slug: 'privacy', title: 'حریم خصوصی', content: '', meta_title: '', meta_description: '', is_active: true },
  { slug: 'contact', title: 'تماس با ما', content: '', meta_title: '', meta_description: '', is_active: true },
];

const pageLabels: Record<string, string> = {
  about: 'درباره ما',
  faq: 'سوالات متداول',
  terms: 'قوانین و مقررات',
  help: 'راهنمای سایت',
  privacy: 'حریم خصوصی',
  contact: 'تماس با ما',
};


const AdminStaticPages = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<StaticPage[]>(defaultPages);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/static-pages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success && data.data?.pages && data.data.pages.length > 0) {
        // Merge with defaults to ensure all pages exist
        const loadedPages = data.data.pages;
        const mergedPages = defaultPages.map(dp => {
          const found = loadedPages.find((p: StaticPage) => p.slug === dp.slug);
          return found ? { ...dp, ...found } : dp;
        });
        setPages(mergedPages);
      } else {
        // Use defaults if no pages in DB
        setPages(defaultPages);
      }
    } catch (error) {
      console.error('Error loading static pages:', error);
      // Keep defaults on error
      setPages(defaultPages);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (slug: string) => {
    const page = pages.find(p => p.slug === slug);
    if (!page) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/static-pages/${slug}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: page.title,
          content: page.content,
          meta_title: page.meta_title || page.title,
          meta_description: page.meta_description || '',
          is_active: page.is_active
        })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('صفحه با موفقیت ذخیره شد');
      } else {
        toast.error(data.message || 'خطا در ذخیره صفحه');
      }
    } catch (error) {
      console.error('Error saving static page:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  const updatePage = (slug: string, field: string, value: any) => {
    setPages(prev => prev.map(p => 
      p.slug === slug ? { ...p, [field]: value } : p
    ));
  };

  const getPage = (slug: string) => pages.find(p => p.slug === slug);

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            مدیریت صفحات استاتیک
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadPages}>
            <RefreshCw className="w-4 h-4 ml-2" />
            بروزرسانی
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 محتوای این صفحات در سایت نمایش داده می‌شود. اگر محتوا خالی باشد، محتوای پیش‌فرض نمایش داده می‌شود.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 mb-6">
              {Object.entries(pageLabels).map(([slug, label]) => {
                const Icon = pageIcons[slug] || FileText;
                return (
                  <TabsTrigger key={slug} value={slug} className="flex items-center gap-1 text-xs sm:text-sm">
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {pages.map((page) => (
              <TabsContent key={page.slug} value={page.slug} className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{pageLabels[page.slug]}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">فعال:</span>
                      <Switch
                        checked={page.is_active}
                        onCheckedChange={(checked) => updatePage(page.slug, 'is_active', checked)}
                      />
                    </div>
                    <Badge variant={page.is_active ? "default" : "secondary"}>
                      {page.is_active ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">عنوان صفحه</label>
                    <Input
                      value={page.title}
                      onChange={(e) => updatePage(page.slug, 'title', e.target.value)}
                      placeholder="عنوان صفحه"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">عنوان SEO</label>
                    <Input
                      value={page.meta_title || ''}
                      onChange={(e) => updatePage(page.slug, 'meta_title', e.target.value)}
                      placeholder="عنوان برای موتورهای جستجو"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">توضیحات SEO</label>
                  <Input
                    value={page.meta_description || ''}
                    onChange={(e) => updatePage(page.slug, 'meta_description', e.target.value)}
                    placeholder="توضیحات برای موتورهای جستجو"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">محتوای صفحه (HTML)</label>
                  <Textarea
                    value={page.content || ''}
                    onChange={(e) => updatePage(page.slug, 'content', e.target.value)}
                    placeholder="محتوای صفحه را وارد کنید... (می‌توانید از HTML استفاده کنید)"
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    اگر خالی بگذارید، محتوای پیش‌فرض نمایش داده می‌شود.
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => handleSave(page.slug)} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        ذخیره تغییرات
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => window.open(`/${page.slug === 'privacy' ? 'privacy-policy' : page.slug}`, '_blank')}>
                    <Eye className="w-4 h-4 ml-2" />
                    پیش‌نمایش
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStaticPages;
