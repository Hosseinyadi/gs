export type ListingType = 'rent' | 'sale';

interface ListingSeoContext {
  title: string;
  type: ListingType;
  categoryName?: string;
  provinceName?: string;
  cityName?: string;
  neighborhoodName?: string;
}

const normalize = (value?: string | null): string => {
  if (!value) return '';
  return value.toString().trim();
};

/**
 * تولید تگ‌های سئو برای آگهی‌ها براساس عنوان، دسته‌بندی و موقعیت مکانی
 * هدف: عبارات طبیعی و مفید برای جستجوی گوگل مثل "اجاره بیل مکانیکی شهرری تهران"
 */
export const generateListingSeoTags = (ctx: ListingSeoContext): string[] => {
  const title = normalize(ctx.title);
  const typeLabel = ctx.type === 'rent' ? 'اجاره' : 'فروش';
  const category = normalize(ctx.categoryName);
  const province = normalize(ctx.provinceName);
  const city = normalize(ctx.cityName);
  const neighborhood = normalize(ctx.neighborhoodName);

  const locationParts = [neighborhood, city, province].filter(Boolean);
  const locationFull = locationParts.join(' ');

  const baseMachine = category || title;
  const tags: string[] = [];

  // خود عنوان آگهی
  if (title) {
    tags.push(title);
  }

  // عبارات اصلی براساس نوع آگهی + ماشین + موقعیت
  if (baseMachine && locationFull) {
    tags.push(`${typeLabel} ${baseMachine} ${locationFull}`);
    tags.push(`${typeLabel} ${baseMachine} در ${locationFull}`);
  }

  // عبارات کلی‌تر بدون موقعیت
  if (baseMachine) {
    tags.push(`${typeLabel} ${baseMachine}`);
    tags.push(`آگهی ${typeLabel} ${baseMachine}`);
  }

  // ترکیب دسته‌بندی با شهر/استان
  if (category && city) {
    tags.push(`${category} در ${city}`);
  }
  if (category && province) {
    tags.push(`${category} در ${province}`);
  }

  // عبارات عمومی برای ماشین‌آلات سنگین در موقعیت
  if (locationFull) {
    tags.push(`اجاره ماشین آلات سنگین ${locationFull}`);
    tags.push(`خرید و فروش ماشین آلات سنگین ${locationFull}`);
  }

  // پاک‌سازی و یکتا کردن
  const unique = Array.from(new Set(tags.map((t) => t.trim()))).filter(
    (t) => t.length > 0
  );

  // محدود کردن تعداد تگ‌ها تا حد معقول برای سئو
  return unique.slice(0, 10);
};
