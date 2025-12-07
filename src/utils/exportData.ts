// Export utilities for admin panel

interface ExportOptions {
  filename: string;
  sheetName?: string;
}

// Export data to Excel (CSV format for compatibility)
export const exportToExcel = (data: any[], options: ExportOptions) => {
  const { filename } = options;
  
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    // BOM for UTF-8
    '\ufeff',
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes
        const escaped = String(value || '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export payments to Excel
export const exportPaymentsToExcel = (payments: any[]) => {
  const formattedData = payments.map(payment => ({
    'شماره تراکنش': payment.id,
    'شماره کاربر': payment.user_phone,
    'عنوان آگهی': payment.listing_title,
    'پلن': payment.plan_name,
    'مبلغ (تومان)': payment.amount,
    'روش پرداخت': payment.payment_method === 'gateway' ? 'درگاه بانکی' : 
                   payment.payment_method === 'card_transfer' ? 'کارت به کارت' : 'کیف پول',
    'وضعیت': payment.status === 'completed' ? 'تکمیل شده' :
             payment.status === 'pending' ? 'در انتظار' :
             payment.status === 'failed' ? 'ناموفق' : 'رد شده',
    'شماره پیگیری': payment.ref_id || '-',
    'تاریخ': new Date(payment.created_at).toLocaleDateString('fa-IR')
  }));

  exportToExcel(formattedData, {
    filename: `payments_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'پرداخت‌ها'
  });
};

// Export users to Excel
export const exportUsersToExcel = (users: any[]) => {
  const formattedData = users.map(user => ({
    'شناسه': user.id,
    'نام': user.name || '-',
    'شماره تماس': user.phone,
    'ایمیل': user.email || '-',
    'تعداد آگهی': user.listings_count || 0,
    'موجودی کیف پول': user.wallet_balance || 0,
    'وضعیت': user.is_blocked ? 'مسدود' : 'فعال',
    'تاریخ عضویت': new Date(user.created_at).toLocaleDateString('fa-IR')
  }));

  exportToExcel(formattedData, {
    filename: `users_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'کاربران'
  });
};

// Export listings to Excel
export const exportListingsToExcel = (listings: any[]) => {
  const formattedData = listings.map(listing => ({
    'شناسه': listing.id,
    'عنوان': listing.title,
    'قیمت (تومان)': listing.price,
    'نوع': listing.type === 'rent' ? 'اجاره' : 'فروش',
    'دسته‌بندی': listing.category_name || '-',
    'موقعیت': listing.location,
    'بازدید': listing.view_count || 0,
    'وضعیت': listing.is_active ? 'فعال' : 'غیرفعال',
    'ویژه': listing.is_featured ? 'بله' : 'خیر',
    'تاریخ ثبت': new Date(listing.created_at).toLocaleDateString('fa-IR')
  }));

  exportToExcel(formattedData, {
    filename: `listings_${new Date().toISOString().split('T')[0]}`,
    sheetName: 'آگهی‌ها'
  });
};

// Export to CSV (fallback if xlsx not available)
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};
