import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface City {
  id: number;
  name: string;
  province?: string;
}

interface CitySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CitySelect = ({ 
  value, 
  onValueChange, 
  placeholder = "انتخاب شهر", 
  className,
  disabled = false 
}: CitySelectProps) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/cities');
      if (!response.ok) {
        console.error('Cities API error:', response.status);
        return;
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Cities API returned non-JSON');
        return;
      }
      const data = await response.json();
      
      if (data.success && data.data?.cities) {
        setCities(data.data.cities);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (city.province && city.province.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedCity = cities.find(city => city.name === value);

  return (
    <div className={cn("relative", className)}>
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder={placeholder}>
              {selectedCity ? (
                <span>
                  {selectedCity.name}
                  {selectedCity.province && (
                    <span className="text-muted-foreground text-sm mr-2">
                      ({selectedCity.province})
                    </span>
                  )}
                </span>
              ) : (
                placeholder
              )}
            </SelectValue>
          </div>
        </SelectTrigger>
        
        <SelectContent 
          position="popper" 
          className="w-full max-h-[300px] overflow-hidden p-0"
          sideOffset={4}
        >
          {/* جستجو */}
          <div className="sticky top-0 bg-white border-b p-2 z-10">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در شهرها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 pl-8 h-8 text-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* لیست شهرها */}
          <div className="max-h-[200px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                در حال بارگذاری...
              </div>
            ) : filteredCities.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchTerm ? 'شهری یافت نشد' : 'هیچ شهری موجود نیست'}
              </div>
            ) : (
              <>
                {/* شهرهای پرجمعیت (اولویت بالا) */}
                {!searchTerm && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-gray-50 sticky top-0">
                      شهرهای پرجمعیت
                    </div>
                    {filteredCities
                      .filter(city => ['تهران', 'مشهد', 'اصفهان', 'کرج', 'شیراز', 'تبریز'].includes(city.name))
                      .map((city) => (
                        <SelectItem 
                          key={`popular-${city.id}`} 
                          value={city.name}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{city.name}</span>
                            {city.province && (
                              <span className="text-xs text-muted-foreground mr-2">
                                {city.province}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    }
                    
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-gray-50">
                      سایر شهرها
                    </div>
                  </>
                )}
                
                {/* باقی شهرها */}
                {filteredCities
                  .filter(city => searchTerm || !['تهران', 'مشهد', 'اصفهان', 'کرج', 'شیراز', 'تبریز'].includes(city.name))
                  .map((city) => (
                    <SelectItem 
                      key={city.id} 
                      value={city.name}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{city.name}</span>
                        {city.province && (
                          <span className="text-xs text-muted-foreground mr-2">
                            {city.province}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                }
              </>
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CitySelect;