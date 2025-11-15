# Requirements Document - Admin Role Management System

## Introduction

این سیستم یک مدیریت کامل نقش‌ها و دسترسی‌های ادمین را فراهم می‌کند که به مدیر اصلی (Super Admin) اجازه می‌دهد ادمین‌های دیگر را با سطوح دسترسی مختلف ایجاد، مدیریت و حذف کند. همچنین تمام اقدامات ادمین‌ها لاگ می‌شود تا امنیت و شفافیت کامل وجود داشته باشد.

## Glossary

- **System**: سیستم مدیریت نقش‌های ادمین
- **Super Admin**: مدیر اصلی با دسترسی کامل به تمام بخش‌ها
- **Admin User**: کاربر ادمین با دسترسی محدود بر اساس نقش
- **Role**: نقش یا سطح دسترسی (مثل: مدیر محتوا، پشتیبانی)
- **Permission**: مجوز دسترسی به یک عملیات خاص
- **Audit Log**: لاگ تمام اقدامات ادمین‌ها
- **Action**: عملیاتی که توسط ادمین انجام می‌شود

## Requirements

### Requirement 1: Super Admin Management

**User Story:** به عنوان مدیر اصلی، می‌خواهم بتوانم ادمین‌های جدید ایجاد کنم، تا بتوانم وظایف را تقسیم کنم.

#### Acceptance Criteria

1. WHEN مدیر اصلی درخواست ایجاد ادمین جدید می‌دهد، THE System SHALL یک فرم با فیلدهای username، password، name، email و role نمایش دهد.

2. WHEN مدیر اصلی فرم ایجاد ادمین را submit می‌کند، THE System SHALL اطلاعات را validate کند و در صورت معتبر بودن، ادمین جدید را در database ذخیره کند.

3. WHEN ادمین جدید ایجاد می‌شود، THE System SHALL password را hash کند و در audit log ثبت کند.

4. THE System SHALL به مدیر اصلی اجازه دهد لیست تمام ادمین‌ها را مشاهده کند.

5. THE System SHALL به مدیر اصلی اجازه دهد ادمین‌های موجود را ویرایش یا حذف کند.

### Requirement 2: Role-Based Access Control

**User Story:** به عنوان مدیر اصلی، می‌خواهم نقش‌های مختلف با دسترسی‌های متفاوت تعریف کنم، تا امنیت سیستم حفظ شود.

#### Acceptance Criteria

1. THE System SHALL سه نقش پیش‌فرض داشته باشد: Super Admin، Content Manager، Support.

2. WHEN یک ادمین به سیستم login می‌کند، THE System SHALL نقش و permissions او را بررسی کند.

3. WHEN یک ادمین سعی می‌کند به بخشی دسترسی پیدا کند، THE System SHALL بررسی کند که آیا permission لازم را دارد یا خیر.

4. IF ادمین permission لازم را نداشته باشد، THEN THE System SHALL دسترسی را رد کند و پیام خطای مناسب نمایش دهد.

5. THE System SHALL به مدیر اصلی اجازه دهد permissions هر نقش را تغییر دهد.

### Requirement 3: Permission System

**User Story:** به عنوان سیستم، می‌خواهم permissions دقیق برای هر عملیات داشته باشم، تا کنترل کامل بر دسترسی‌ها وجود داشته باشد.

#### Acceptance Criteria

1. THE System SHALL permissions زیر را پشتیبانی کند:
   - view_dashboard: مشاهده داشبورد
   - manage_listings: مدیریت آگهی‌ها
   - approve_listings: تایید/رد آگهی‌ها
   - manage_users: مدیریت کاربران
   - manage_payments: مدیریت پرداخت‌ها
   - view_payments: مشاهده پرداخت‌ها
   - manage_featured: مدیریت ویژه‌سازی
   - manage_discounts: مدیریت کدهای تخفیف
   - view_analytics: مشاهده آنالیتیکس
   - manage_settings: مدیریت تنظیمات
   - manage_admins: مدیریت ادمین‌ها
   - view_audit_logs: مشاهده لاگ‌ها

2. THE System SHALL permission "all" را برای Super Admin در نظر بگیرد که دسترسی به همه چیز دارد.

3. WHEN یک endpoint فراخوانی می‌شود، THE System SHALL middleware مربوطه را اجرا کند که permission لازم را بررسی کند.

4. THE System SHALL به صورت پیش‌فرض دسترسی را رد کند مگر اینکه permission صریح وجود داشته باشد.

### Requirement 4: Audit Logging

**User Story:** به عنوان مدیر اصلی، می‌خواهم تمام اقدامات ادمین‌ها لاگ شود، تا بتوانم فعالیت‌ها را پیگیری کنم.

#### Acceptance Criteria

1. WHEN یک ادمین عملیاتی انجام می‌دهد، THE System SHALL اطلاعات زیر را در audit log ثبت کند:
   - admin_id
   - action (نوع عملیات)
   - target_type (نوع هدف: listing، payment، user، etc.)
   - target_id (شناسه هدف)
   - details (جزئیات JSON)
   - ip_address
   - timestamp

2. THE System SHALL actions زیر را لاگ کند:
   - admin_login
   - admin_logout
   - create_admin
   - update_admin
   - delete_admin
   - approve_listing
   - reject_listing
   - approve_payment
   - reject_payment
   - create_discount
   - update_settings
   - make_featured
   - remove_featured

3. THE System SHALL به مدیر اصلی اجازه دهد audit logs را با فیلترهای مختلف مشاهده کند.

4. THE System SHALL audit logs را به صورت read-only نگه دارد و امکان حذف یا ویرایش نداشته باشد.

### Requirement 5: Admin User Interface

**User Story:** به عنوان مدیر اصلی، می‌خواهم یک رابط کاربری ساده برای مدیریت ادمین‌ها داشته باشم، تا به راحتی آن‌ها را مدیریت کنم.

#### Acceptance Criteria

1. THE System SHALL یک صفحه Admin Management در admin panel داشته باشد.

2. THE System SHALL لیست تمام ادمین‌ها را با اطلاعات زیر نمایش دهد:
   - username
   - name
   - role
   - last_login
   - is_active
   - created_at

3. THE System SHALL دکمه‌های Create، Edit، Delete و Toggle Active برای هر ادمین داشته باشد.

4. WHEN مدیر اصلی روی Create کلیک می‌کند، THE System SHALL یک dialog با فرم ایجاد ادمین نمایش دهد.

5. THE System SHALL به مدیر اصلی اجازه دهد ادمین‌ها را فعال یا غیرفعال کند بدون حذف آن‌ها.

### Requirement 6: Audit Log Viewer

**User Story:** به عنوان مدیر اصلی، می‌خواهم تمام اقدامات ادمین‌ها را مشاهده کنم، تا از امنیت سیستم اطمینان حاصل کنم.

#### Acceptance Criteria

1. THE System SHALL یک صفحه Audit Logs در admin panel داشته باشد که فقط Super Admin به آن دسترسی دارد.

2. THE System SHALL فیلترهای زیر را برای audit logs فراهم کند:
   - admin_id
   - action type
   - target_type
   - date range
   - search

3. THE System SHALL برای هر log اطلاعات کامل شامل admin name، action، target، details، IP و timestamp نمایش دهد.

4. THE System SHALL امکان export audit logs به CSV را فراهم کند.

5. THE System SHALL logs را به صورت paginated نمایش دهد.

### Requirement 7: Security & Validation

**User Story:** به عنوان سیستم، می‌خواهم امنیت کامل در مدیریت ادمین‌ها داشته باشم، تا از سوء استفاده جلوگیری شود.

#### Acceptance Criteria

1. THE System SHALL username را unique و بین 3 تا 50 کاراکتر validate کند.

2. THE System SHALL password را حداقل 8 کاراکتر با ترکیب حروف و اعداد validate کند.

3. THE System SHALL به مدیر اصلی اجازه ندهد خودش را حذف کند.

4. THE System SHALL حداقل یک Super Admin در سیستم نگه دارد.

5. WHEN یک ادمین حذف می‌شود، THE System SHALL تمام sessions فعال او را invalidate کند.

6. THE System SHALL تلاش‌های ناموفق login را لاگ کند و بعد از 5 تلاش ناموفق، account را برای 15 دقیقه lock کند.

### Requirement 8: Role Permissions Mapping

**User Story:** به عنوان مدیر اصلی، می‌خواهم بدانم هر نقش چه دسترسی‌هایی دارد، تا تصمیم‌گیری بهتری داشته باشم.

#### Acceptance Criteria

1. THE System SHALL نقش Super Admin را با permission "all" تعریف کند.

2. THE System SHALL نقش Content Manager را با permissions زیر تعریف کند:
   - view_dashboard
   - manage_listings
   - approve_listings
   - view_analytics

3. THE System SHALL نقش Support را با permissions زیر تعریف کند:
   - view_dashboard
   - view_listings
   - view_users
   - view_payments

4. THE System SHALL به مدیر اصلی اجازه دهد نقش‌های سفارشی با permissions دلخواه ایجاد کند.

5. THE System SHALL تغییرات permissions را بلافاصله اعمال کند بدون نیاز به logout/login.

---

**تاریخ ایجاد**: 11 نوامبر 2025
**وضعیت**: Draft
**اولویت**: بالا ⭐⭐⭐

