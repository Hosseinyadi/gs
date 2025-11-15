# Design Document - سیستم پرداخت و ویژه‌سازی آگهی

## Overview

این سیستم یک پلتفرم کامل برای ویژه‌سازی آگهی‌ها با پرداخت آنلاین، مدیریت مالی، و سیستم ارائه‌دهندگان خدمات را پیاده‌سازی می‌کند. معماری سیستم بر اساس الگوی MVC و RESTful API طراحی شده است.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Panel   │  │ Admin Panel  │  │ Payment UI   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth         │  │ Rate Limiter │  │ Validation   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Payment    │  │   Featured   │  │   Service    │
│   Service    │  │   Service    │  │   Provider   │
│              │  │              │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (SQLite)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transactions │  │ Featured     │  │ Service      │      │
│  │              │  │ Listings     │  │ Providers    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ZarinPal     │  │ PayPing      │  │ SMS Service  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Featured Plans Service

**Purpose**: مدیریت پلن‌های ویژه‌سازی و قیمت‌گذاری

**Endpoints**:
```
GET    /api/featured-plans              - دریافت لیست پلن‌ها
GET    /api/featured-plans/:id          - دریافت جزئیات یک پلن
POST   /api/admin/featured-plans        - ایجاد پلن جدید (Admin)
PUT    /api/admin/featured-plans/:id    - ویرایش پلن (Admin)
DELETE /api/admin/featured-plans/:id    - حذف پلن (Admin)
```

**Data Model**:
```typescript
interface FeaturedPlan {
  id: number;
  name: string;              // "روزانه", "هفتگی", "ماهانه"
  duration_days: number;     // 1, 7, 30
  price: number;             // قیمت به تومان
  discount_percent: number;  // درصد تخفیف (اختیاری)
  is_active: boolean;
  features: string[];        // ویژگی‌های پلن
  created_at: Date;
  updated_at: Date;
}
```

### 2. Payment Service

**Purpose**: مدیریت پرداخت‌ها و اتصال به درگاه‌های بانکی

**Endpoints**:
```
POST   /api/payments/initiate           - شروع پرداخت
POST   /api/payments/verify             - تایید پرداخت (Callback)
POST   /api/payments/card-transfer      - ثبت پرداخت کارت به کارت
GET    /api/payments/my-payments        - تاریخچه پرداخت‌های کاربر
GET    /api/admin/payments              - لیست تمام پرداخت‌ها (Admin)
POST   /api/admin/payments/:id/approve  - تایید پرداخت (Admin)
POST   /api/admin/payments/:id/reject   - رد پرداخت (Admin)
```

**Data Model**:
```typescript
interface Payment {
  id: number;
  user_id: number;
  listing_id: number;
  plan_id: number;
  amount: number;
  payment_method: 'gateway' | 'card_transfer' | 'wallet';
  gateway_name?: string;     // 'zarinpal', 'payping', etc.
  transaction_id?: string;   // شماره تراکنش درگاه
  authority?: string;        // Authority از درگاه
  ref_id?: string;          // شماره پیگیری
  receipt_image?: string;    // تصویر رسید (برای کارت به کارت)
  status: 'pending' | 'completed' | 'failed' | 'rejected';
  rejection_reason?: string;
  verified_by?: number;      // Admin ID
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

**Payment Gateway Integration**:
```typescript
interface PaymentGateway {
  name: string;
  request(amount: number, callback_url: string): Promise<{
    authority: string;
    payment_url: string;
  }>;
  verify(authority: string, amount: number): Promise<{
    success: boolean;
    ref_id: string;
  }>;
}

// پیاده‌سازی برای ZarinPal
class ZarinPalGateway implements PaymentGateway {
  private merchant_id: string;
  private sandbox: boolean;
  
  async request(amount: number, callback_url: string) {
    // اتصال به API زرین‌پال
  }
  
  async verify(authority: string, amount: number) {
    // تایید پرداخت
  }
}
```

### 3. Featured Listing Service

**Purpose**: مدیریت آگهی‌های ویژه و زمان‌بندی آن‌ها

**Endpoints**:
```
POST   /api/listings/:id/make-featured  - ویژه کردن آگهی
GET    /api/listings/featured           - دریافت آگهی‌های ویژه
GET    /api/user/featured-listings      - آگهی‌های ویژه کاربر
```

**Business Logic**:
```typescript
class FeaturedListingService {
  async makeFeatured(
    listing_id: number,
    plan_id: number,
    payment_id: number
  ): Promise<void> {
    // 1. بررسی پرداخت موفق
    // 2. محاسبه تاریخ شروع و پایان
    // 3. ویژه کردن آگهی
    // 4. ثبت در جدول featured_listings
    // 5. ارسال نوتیفیکیشن به کاربر
  }
  
  async checkExpiredListings(): Promise<void> {
    // Cron Job برای بررسی آگهی‌های منقضی شده
    // اجرا هر ساعت
  }
  
  async notifyExpiringListings(): Promise<void> {
    // اطلاع‌رسانی 24 ساعت قبل از انقضا
  }
}
```

### 4. Service Provider Service

**Purpose**: مدیریت ارائه‌دهندگان خدمات

**Endpoints**:
```
POST   /api/service-providers/apply     - درخواست ارائه‌دهنده خدمات
GET    /api/service-providers/my-status - وضعیت درخواست کاربر
GET    /api/admin/service-providers     - لیست درخواست‌ها (Admin)
POST   /api/admin/service-providers/:id/approve - تایید (Admin)
POST   /api/admin/service-providers/:id/reject  - رد (Admin)
POST   /api/admin/service-providers/:id/revoke  - لغو دسترسی (Admin)
```

**Data Model**:
```typescript
interface ServiceProvider {
  id: number;
  user_id: number;
  business_name: string;
  business_type: 'repair' | 'parts' | 'transport' | 'other';
  phone: string;
  email: string;
  address: string;
  description: string;
  documents: string[];       // آرایه URL مدارک
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  rejection_reason?: string;
  reviewed_by?: number;
  reviewed_at?: Date;
  created_at: Date;
  updated_at: Date;
}
```

### 5. User Panel Service

**Purpose**: پنل کاربری برای مدیریت آگهی‌ها و پرداخت‌ها

**Endpoints**:
```
GET    /api/user/dashboard              - داشبورد کاربر
GET    /api/user/listings               - آگهی‌های کاربر
GET    /api/user/payments               - پرداخت‌های کاربر
GET    /api/user/wallet                 - کیف پول کاربر
GET    /api/user/notifications          - نوتیفیکیشن‌ها
POST   /api/user/notifications/:id/read - خواندن نوتیفیکیشن
```

**Dashboard Data**:
```typescript
interface UserDashboard {
  stats: {
    total_listings: number;
    active_listings: number;
    featured_listings: number;
    pending_listings: number;
    total_views: number;
    wallet_balance: number;
  };
  recent_listings: Listing[];
  recent_payments: Payment[];
  notifications: Notification[];
  is_service_provider: boolean;
}
```

### 6. Admin Payment Management

**Purpose**: مدیریت پرداخت‌ها و تنظیمات مالی توسط مدیر

**Endpoints**:
```
GET    /api/admin/payments/stats        - آمار پرداخت‌ها
GET    /api/admin/payments/pending      - پرداخت‌های در انتظار تایید
GET    /api/admin/payments/report       - گزارش مالی
PUT    /api/admin/settings/payment      - تنظیمات پرداخت
GET    /api/admin/settings/payment      - دریافت تنظیمات
```

**Payment Settings**:
```typescript
interface PaymentSettings {
  gateway_enabled: boolean;
  card_transfer_enabled: boolean;
  wallet_enabled: boolean;
  default_gateway: string;
  card_number: string;        // شماره کارت برای کارت به کارت
  card_holder_name: string;
  bank_name: string;
  zarinpal_merchant_id?: string;
  payping_token?: string;
  auto_approve_gateway: boolean;  // تایید خودکار پرداخت درگاهی
}
```

## Data Models

### Database Schema

```sql
-- Featured Plans Table
CREATE TABLE IF NOT EXISTS featured_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    duration_days INTEGER NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    discount_percent INTEGER DEFAULT 0,
    features TEXT,  -- JSON array
    is_active BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default plans
INSERT INTO featured_plans (name, name_en, duration_days, price, features, display_order) VALUES
('روزانه', 'daily', 1, 50000, '["نمایش در بالای لیست","علامت ویژه"]', 1),
('هفتگی', 'weekly', 7, 300000, '["نمایش در بالای لیست","علامت ویژه","پشتیبانی اولویت‌دار"]', 2),
('ماهانه', 'monthly', 30, 1000000, '["نمایش در بالای لیست","علامت ویژه","پشتیبانی اولویت‌دار","گزارش آمار"]', 3);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    plan_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,  -- gateway, card_transfer, wallet
    gateway_name VARCHAR(50),
    transaction_id VARCHAR(100),
    authority VARCHAR(100),
    ref_id VARCHAR(100),
    receipt_image TEXT,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed, rejected
    rejection_reason TEXT,
    verified_by INTEGER,
    verified_at DATETIME,
    metadata TEXT,  -- JSON for extra data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (plan_id) REFERENCES featured_plans(id),
    FOREIGN KEY (verified_by) REFERENCES admin_users(id)
);

-- Update Featured Listings Table
ALTER TABLE featured_listings ADD COLUMN plan_id INTEGER;
ALTER TABLE featured_listings ADD COLUMN payment_id INTEGER;
ALTER TABLE featured_listings ADD FOREIGN KEY (plan_id) REFERENCES featured_plans(id);
ALTER TABLE featured_listings ADD FOREIGN KEY (payment_id) REFERENCES payments(id);

-- Service Providers Table (already exists, just update)
-- Already defined in schema.sql

-- Payment Settings Table
CREATE TABLE IF NOT EXISTS payment_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id)
);

-- Insert default payment settings
INSERT OR IGNORE INTO payment_settings (setting_key, setting_value) VALUES
('gateway_enabled', 'true'),
('card_transfer_enabled', 'true'),
('wallet_enabled', 'true'),
('default_gateway', 'zarinpal'),
('auto_approve_gateway', 'true'),
('card_number', ''),
('card_holder_name', ''),
('bank_name', '');

-- Notifications Table (enhance existing)
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',  -- info, success, warning, error
    category VARCHAR(50),  -- payment, listing, service_provider
    related_id INTEGER,  -- ID of related entity
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
```

## Error Handling

### Payment Errors

```typescript
enum PaymentErrorCode {
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  ALREADY_PAID = 'ALREADY_PAID',
  LISTING_NOT_FOUND = 'LISTING_NOT_FOUND',
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE'
}

class PaymentError extends Error {
  constructor(
    public code: PaymentErrorCode,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}
```

### Error Responses

```typescript
// Success Response
{
  success: true,
  data: { ... },
  message: "عملیات با موفقیت انجام شد"
}

// Error Response
{
  success: false,
  error: {
    code: "PAYMENT_FAILED",
    message: "پرداخت ناموفق بود",
    details: { ... }
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('PaymentService', () => {
  test('should initiate payment successfully', async () => {
    // Test payment initiation
  });
  
  test('should verify payment with valid authority', async () => {
    // Test payment verification
  });
  
  test('should reject invalid payment', async () => {
    // Test error handling
  });
});

describe('FeaturedListingService', () => {
  test('should make listing featured after payment', async () => {
    // Test featured listing creation
  });
  
  test('should expire featured listing after duration', async () => {
    // Test expiration logic
  });
});
```

### Integration Tests

```typescript
describe('Payment Flow', () => {
  test('complete payment flow from initiation to verification', async () => {
    // 1. User selects plan
    // 2. Initiates payment
    // 3. Redirects to gateway
    // 4. Gateway callback
    // 5. Verify payment
    // 6. Make listing featured
    // 7. Send notification
  });
});
```

### E2E Tests

- تست کامل فرآیند پرداخت از UI
- تست پرداخت کارت به کارت
- تست تایید/رد توسط مدیر
- تست انقضای آگهی ویژه

## Security Considerations

### Payment Security

1. **HTTPS Only**: تمام درخواست‌های پرداخت فقط از طریق HTTPS
2. **CSRF Protection**: استفاده از CSRF token
3. **Rate Limiting**: محدودیت تعداد درخواست پرداخت
4. **Amount Validation**: اعتبارسنجی مبلغ در سمت سرور
5. **Signature Verification**: تایید امضای دیجیتال درگاه

### Data Protection

1. **Encryption**: رمزنگاری اطلاعات حساس
2. **PCI DSS Compliance**: عدم ذخیره اطلاعات کارت
3. **Audit Logging**: ثبت تمام تراکنش‌ها
4. **Access Control**: کنترل دسترسی به اطلاعات مالی

## Performance Optimization

### Caching Strategy

```typescript
// Cache featured plans (1 hour)
const plans = await cache.get('featured_plans', async () => {
  return await db.getFeaturedPlans();
}, 3600);

// Cache payment settings (30 minutes)
const settings = await cache.get('payment_settings', async () => {
  return await db.getPaymentSettings();
}, 1800);
```

### Database Optimization

- Index on frequently queried columns
- Pagination for large result sets
- Connection pooling
- Query optimization

### Background Jobs

```typescript
// Cron jobs
schedule.scheduleJob('0 * * * *', async () => {
  // Check expired featured listings every hour
  await featuredService.checkExpiredListings();
});

schedule.scheduleJob('0 9 * * *', async () => {
  // Send expiration notifications daily at 9 AM
  await featuredService.notifyExpiringListings();
});
```

## Deployment Considerations

### Environment Variables

```env
# Payment Gateway
ZARINPAL_MERCHANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ZARINPAL_SANDBOX=false
PAYPING_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# URLs
PAYMENT_CALLBACK_URL=https://yourdomain.com/api/payments/verify
FRONTEND_URL=https://yourdomain.com

# Security
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### Monitoring

- Payment success/failure rates
- Gateway response times
- Transaction volumes
- Error rates
- User conversion rates

## Migration Plan

### Phase 1: Database Setup
1. Create new tables
2. Insert default data
3. Run migrations

### Phase 2: Backend Implementation
1. Payment service
2. Featured plans service
3. Service provider service
4. Admin endpoints

### Phase 3: Frontend Implementation
1. User panel
2. Payment UI
3. Admin panel updates

### Phase 4: Testing & Deployment
1. Unit tests
2. Integration tests
3. Staging deployment
4. Production deployment

## API Documentation

Full API documentation will be available at `/api/docs` using Swagger/OpenAPI specification.

---

**Next Steps**: Review this design and proceed to implementation tasks.
