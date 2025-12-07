import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  MapPin,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Building,
  Home,
  Search
} from "lucide-react";
import apiService from "@/services/api";

interface Province {
  id: number;
  name: string;
  is_active: boolean;
}

interface City {
  id: number;
  name: string;
  province_id: number;
  province_name?: string;
  is_active: boolean;
}

interface Neighborhood {
  id: number;
  name: string;
  city_id: number;
  city_name?: string;
  is_active: boolean;
}

const AdminCities = () => {
  const [activeTab, setActiveTab] = useState('provinces');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  
  // Selected filters
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  
  // Dialogs
  const [showAddProvince, setShowAddProvince] = useState(false);
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddNeighborhood, setShowAddNeighborhood] = useState(false);
  
  // Form data
  const [newProvinceName, setNewProvinceName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityProvinceId, setNewCityProvinceId] = useState<number | null>(null);
  const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
  const [newNeighborhoodCityId, setNewNeighborhoodCityId] = useState<number | null>(null);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      loadCities(selectedProvinceId);
    }
  }, [selectedProvinceId]);

  useEffect(() => {
    if (selectedCityId) {
      loadNeighborhoods(selectedCityId);
    }
  }, [selectedCityId]);

  const loadProvinces = async () => {
    setLoading(true);
    try {
      const response = await apiService.getProvinces();
      if (response.success && response.data) {
        setProvinces(response.data.provinces.map((p: any) => ({
          ...p,
          is_active: p.is_active !== false
        })));
      }
    } catch (error) {
      console.error('Error loading provinces:', error);
      toast.error('خطا در بارگذاری استان‌ها');
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (provinceId: number) => {
    setLoading(true);
    try {
      const response = await apiService.getCities(provinceId);
      if (response.success && response.data) {
        const province = provinces.find(p => p.id === provinceId);
        setCities(response.data.cities.map((c: any) => ({
          ...c,
          province_name: province?.name,
          is_active: c.is_active !== false
        })));
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      toast.error('خطا در بارگذاری شهرها');
    } finally {
      setLoading(false);
    }
  };

  const loadNeighborhoods = async (cityId: number) => {
    setLoading(true);
    try {
      const response = await apiService.getNeighborhoods(cityId);
      if (response.success && response.data) {
        const city = cities.find(c => c.id === cityId);
        setNeighborhoods(response.data.neighborhoods.map((n: any) => ({
          ...n,
          city_name: city?.name,
          is_active: n.is_active !== false
        })));
      }
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
      toast.error('خطا در بارگذاری محله‌ها');
    } finally {
      setLoading(false);
    }
  };


  const handleAddProvince = async () => {
    if (!newProvinceName.trim()) {
      toast.error('نام استان الزامی است');
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/locations/provinces', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newProvinceName.trim() })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('استان با موفقیت اضافه شد');
        setShowAddProvince(false);
        setNewProvinceName('');
        loadProvinces();
      } else {
        toast.error(data.message || 'خطا در افزودن استان');
      }
    } catch (error) {
      console.error('Error adding province:', error);
      toast.error('خطا در افزودن استان');
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim()) {
      toast.error('نام شهر الزامی است');
      return;
    }
    if (!newCityProvinceId) {
      toast.error('انتخاب استان الزامی است');
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/locations/cities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newCityName.trim(),
          province_id: newCityProvinceId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('شهر با موفقیت اضافه شد');
        setShowAddCity(false);
        setNewCityName('');
        if (selectedProvinceId === newCityProvinceId) {
          loadCities(selectedProvinceId);
        }
      } else {
        toast.error(data.message || 'خطا در افزودن شهر');
      }
    } catch (error) {
      console.error('Error adding city:', error);
      toast.error('خطا در افزودن شهر');
    }
  };

  const handleAddNeighborhood = async () => {
    if (!newNeighborhoodName.trim()) {
      toast.error('نام محله الزامی است');
      return;
    }
    if (!newNeighborhoodCityId) {
      toast.error('انتخاب شهر الزامی است');
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/locations/neighborhoods', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: newNeighborhoodName.trim(),
          city_id: newNeighborhoodCityId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('محله با موفقیت اضافه شد');
        setShowAddNeighborhood(false);
        setNewNeighborhoodName('');
        if (selectedCityId === newNeighborhoodCityId) {
          loadNeighborhoods(selectedCityId);
        }
      } else {
        toast.error(data.message || 'خطا در افزودن محله');
      }
    } catch (error) {
      console.error('Error adding neighborhood:', error);
      toast.error('خطا در افزودن محله');
    }
  };

  const filteredProvinces = provinces.filter(p => 
    p.name.includes(searchTerm)
  );

  const filteredCities = cities.filter(c => 
    c.name.includes(searchTerm)
  );

  const filteredNeighborhoods = neighborhoods.filter(n => 
    n.name.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت مکان‌ها</h2>
          <p className="text-muted-foreground">
            مدیریت استان‌ها، شهرها و محله‌ها
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="جستجو..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="provinces" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            استان‌ها ({provinces.length})
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            شهرها ({cities.length})
          </TabsTrigger>
          <TabsTrigger value="neighborhoods" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            محله‌ها ({neighborhoods.length})
          </TabsTrigger>
        </TabsList>

        {/* استان‌ها */}
        <TabsContent value="provinces">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>لیست استان‌ها</CardTitle>
              <Dialog open={showAddProvince} onOpenChange={setShowAddProvince}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 ml-2" />
                    افزودن استان
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>افزودن استان جدید</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>نام استان</Label>
                      <Input
                        value={newProvinceName}
                        onChange={(e) => setNewProvinceName(e.target.value)}
                        placeholder="مثال: تهران"
                      />
                    </div>
                    <Button onClick={handleAddProvince} className="w-full">
                      افزودن
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredProvinces.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">استانی یافت نشد</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredProvinces.map((province) => (
                    <div 
                      key={province.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProvinceId === province.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedProvinceId(province.id);
                        setSelectedCityId(null);
                        setNeighborhoods([]);
                        setActiveTab('cities');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{province.name}</span>
                        <Badge variant={province.is_active ? "default" : "secondary"} className="text-xs">
                          {province.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        {/* شهرها */}
        <TabsContent value="cities">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>لیست شهرها</CardTitle>
                {selectedProvinceId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    استان: {provinces.find(p => p.id === selectedProvinceId)?.name}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedProvinceId?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedProvinceId(parseInt(value));
                    setSelectedCityId(null);
                    setNeighborhoods([]);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="انتخاب استان" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={showAddCity} onOpenChange={setShowAddCity}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      افزودن شهر
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>افزودن شهر جدید</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>استان</Label>
                        <Select
                          value={newCityProvinceId?.toString() || ''}
                          onValueChange={(value) => setNewCityProvinceId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب استان" />
                          </SelectTrigger>
                          <SelectContent>
                            {provinces.map((province) => (
                              <SelectItem key={province.id} value={province.id.toString()}>
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>نام شهر</Label>
                        <Input
                          value={newCityName}
                          onChange={(e) => setNewCityName(e.target.value)}
                          placeholder="مثال: کرج"
                        />
                      </div>
                      <Button onClick={handleAddCity} className="w-full">
                        افزودن
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedProvinceId ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">ابتدا یک استان انتخاب کنید</p>
                </div>
              ) : loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredCities.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">شهری یافت نشد</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredCities.map((city) => (
                    <div 
                      key={city.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedCityId === city.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedCityId(city.id);
                        setActiveTab('neighborhoods');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{city.name}</span>
                        <Badge variant={city.is_active ? "default" : "secondary"} className="text-xs">
                          {city.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* محله‌ها */}
        <TabsContent value="neighborhoods">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>لیست محله‌ها</CardTitle>
                {selectedCityId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    شهر: {cities.find(c => c.id === selectedCityId)?.name}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedCityId?.toString() || ''}
                  onValueChange={(value) => setSelectedCityId(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="انتخاب شهر" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={showAddNeighborhood} onOpenChange={setShowAddNeighborhood}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 ml-2" />
                      افزودن محله
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>افزودن محله جدید</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>شهر</Label>
                        <Select
                          value={newNeighborhoodCityId?.toString() || ''}
                          onValueChange={(value) => setNewNeighborhoodCityId(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب شهر" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={city.id.toString()}>
                                {city.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>نام محله</Label>
                        <Input
                          value={newNeighborhoodName}
                          onChange={(e) => setNewNeighborhoodName(e.target.value)}
                          placeholder="مثال: ونک"
                        />
                      </div>
                      <Button onClick={handleAddNeighborhood} className="w-full">
                        افزودن
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedCityId ? (
                <div className="text-center py-8">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">ابتدا یک شهر انتخاب کنید</p>
                </div>
              ) : loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : filteredNeighborhoods.length === 0 ? (
                <div className="text-center py-8">
                  <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">محله‌ای یافت نشد</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    می‌توانید محله جدید اضافه کنید
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredNeighborhoods.map((neighborhood) => (
                    <div 
                      key={neighborhood.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{neighborhood.name}</span>
                        <Badge variant={neighborhood.is_active ? "default" : "secondary"} className="text-xs">
                          {neighborhood.is_active ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* راهنما */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-800 mb-2">راهنمای استفاده</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>برای مشاهده شهرهای هر استان، روی استان کلیک کنید</li>
            <li>برای مشاهده محله‌های هر شهر، روی شهر کلیک کنید</li>
            <li>محله‌ها معمولاً فقط برای شهرهای بزرگ مثل تهران تعریف می‌شوند</li>
            <li>استان‌ها و شهرها از پیش تعریف شده‌اند و می‌توانید محله اضافه کنید</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCities;
