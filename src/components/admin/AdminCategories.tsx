import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import apiService from "@/services/api";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  category_type: string;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', category_type: 'equipment' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminCategories();
      if (response.success && response.data?.categories) {
        setCategories(response.data.categories);
      } else {
        toast.error(response.message || 'خطا در بارگذاری دسته‌بندی‌ها');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('نام دسته‌بندی الزامی است');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('در حال افزودن دسته‌بندی...');

    try {
      const slug = newCategory.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const response = await apiService.createCategory({
        name: newCategory.name,
        slug: slug,
        icon: newCategory.icon,
        category_type: newCategory.category_type
      });

      if (response.success) {
        toast.dismiss(toastId);
        toast.success('دسته‌بندی با موفقیت اضافه شد');
        setNewCategory({ name: '', icon: '', category_type: 'equipment' });
        await loadCategories();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در افزودن دسته‌بندی');
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingCategory({ ...category });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingCategory(null);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error('نام دسته‌بندی الزامی است');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('در حال ذخیره تغییرات...');

    try {
      const response = await apiService.updateCategory(editingCategory.id, {
        name: editingCategory.name,
        icon: editingCategory.icon,
        category_type: editingCategory.category_type
      });

      if (response.success) {
        toast.dismiss(toastId);
        toast.success('دسته‌بندی با موفقیت ویرایش شد');
        setEditingId(null);
        setEditingCategory(null);
        await loadCategories();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در ویرایش دسته‌بندی');
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این دسته‌بندی اطمینان دارید؟')) return;

    const toastId = toast.loading('در حال حذف دسته‌بندی...');

    try {
      const response = await apiService.deleteCategory(id);
      if (response.success) {
        toast.dismiss(toastId);
        toast.success('دسته‌بندی با موفقیت حذف شد');
        await loadCategories();
      } else {
        toast.dismiss(toastId);
        toast.error(response.message || 'خطا در حذف دسته‌بندی');
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('خطا در ارتباط با سرور');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600">در حال بارگذاری دسته‌بندی‌ها...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">مدیریت دسته‌بندی‌ها</h2>
      </div>

      {/* Add New Category */}
      <Card>
        <CardHeader>
          <CardTitle>افزودن دسته‌بندی جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="نام دسته‌بندی"
              value={newCategory.name}
              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
            />
            <Input
              placeholder="آیکون (emoji)"
              value={newCategory.icon}
              onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
              value={newCategory.category_type}
              onChange={(e) => setNewCategory({...newCategory, category_type: e.target.value})}
            >
              <option value="equipment">تجهیزات</option>
              <option value="parts">قطعات</option>
              <option value="services">خدمات</option>
            </select>
            <Button onClick={handleAddCategory} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 ml-2" />
              )}
              افزودن
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>لیست دسته‌بندی‌ها ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                دسته‌بندی یافت نشد
              </div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  {editingId === category.id && editingCategory ? (
                    <div className="flex-1 flex items-center gap-4">
                      <Input
                        value={editingCategory.icon}
                        onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})}
                        placeholder="آیکون"
                        className="w-20"
                      />
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                        placeholder="نام دسته‌بندی"
                        className="flex-1"
                      />
                      <select
                        className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2"
                        value={editingCategory.category_type}
                        onChange={(e) => setEditingCategory({...editingCategory, category_type: e.target.value})}
                      >
                        <option value="equipment">تجهیزات</option>
                        <option value="parts">قطعات</option>
                        <option value="services">خدمات</option>
                      </select>
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={handleSaveEdit} disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-500">{category.slug}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {category.category_type === 'equipment' ? 'تجهیزات' :
                           category.category_type === 'parts' ? 'قطعات' : 'خدمات'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCategories;
