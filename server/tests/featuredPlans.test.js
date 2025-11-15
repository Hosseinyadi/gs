const featuredPlansService = require('../services/featuredPlans');
const db = require('../config/database');

describe('FeaturedPlansService', () => {
  describe('getAllPlans', () => {
    test('should return all plans', async () => {
      const plans = await featuredPlansService.getAllPlans();
      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
    });

    test('should return only active plans when activeOnly is true', async () => {
      const plans = await featuredPlansService.getAllPlans(true);
      expect(Array.isArray(plans)).toBe(true);
      plans.forEach(plan => {
        expect(plan.is_active).toBe(true);
      });
    });

    test('should parse features as array', async () => {
      const plans = await featuredPlansService.getAllPlans();
      plans.forEach(plan => {
        expect(Array.isArray(plan.features)).toBe(true);
      });
    });
  });

  describe('getPlanById', () => {
    test('should return plan by id', async () => {
      const plan = await featuredPlansService.getPlanById(1);
      expect(plan).toBeDefined();
      expect(plan.id).toBe(1);
      expect(Array.isArray(plan.features)).toBe(true);
    });

    test('should throw error for non-existent plan', async () => {
      await expect(featuredPlansService.getPlanById(9999))
        .rejects.toThrow('پلن مورد نظر یافت نشد');
    });
  });

  describe('calculateFinalPrice', () => {
    test('should calculate price without discount', async () => {
      const pricing = await featuredPlansService.calculateFinalPrice(1);
      expect(pricing).toHaveProperty('original_price');
      expect(pricing).toHaveProperty('discount_percent');
      expect(pricing).toHaveProperty('discount_amount');
      expect(pricing).toHaveProperty('final_price');
      expect(pricing.final_price).toBe(pricing.original_price - pricing.discount_amount);
    });

    test('should calculate price with discount', async () => {
      // Create a plan with discount for testing
      const testPlan = await featuredPlansService.createPlan({
        name: 'تست تخفیف',
        name_en: 'test_discount',
        duration_days: 1,
        price: 100000,
        discount_percent: 20,
        features: ['test'],
        is_active: true
      });

      const pricing = await featuredPlansService.calculateFinalPrice(testPlan.id);
      expect(pricing.discount_percent).toBe(20);
      expect(pricing.discount_amount).toBe(20000);
      expect(pricing.final_price).toBe(80000);

      // Cleanup
      await featuredPlansService.deletePlan(testPlan.id);
    });
  });

  describe('createPlan', () => {
    test('should create new plan', async () => {
      const planData = {
        name: 'پلن تست',
        name_en: 'test_plan',
        duration_days: 5,
        price: 150000,
        discount_percent: 10,
        features: ['ویژگی 1', 'ویژگی 2'],
        is_active: true,
        display_order: 10
      };

      const plan = await featuredPlansService.createPlan(planData);
      expect(plan).toBeDefined();
      expect(plan.name).toBe(planData.name);
      expect(plan.duration_days).toBe(planData.duration_days);
      expect(plan.price).toBe(planData.price);
      expect(Array.isArray(plan.features)).toBe(true);

      // Cleanup
      await featuredPlansService.deletePlan(plan.id);
    });

    test('should throw error for invalid data', async () => {
      await expect(featuredPlansService.createPlan({
        name: 'تست',
        // missing required fields
      })).rejects.toThrow('اطلاعات پلن ناقص است');
    });

    test('should throw error for negative duration', async () => {
      await expect(featuredPlansService.createPlan({
        name: 'تست',
        name_en: 'test',
        duration_days: -1,
        price: 100000
      })).rejects.toThrow('مدت زمان پلن باید بیشتر از صفر باشد');
    });

    test('should throw error for negative price', async () => {
      await expect(featuredPlansService.createPlan({
        name: 'تست',
        name_en: 'test',
        duration_days: 1,
        price: -100
      })).rejects.toThrow('قیمت نمی‌تواند منفی باشد');
    });
  });

  describe('updatePlan', () => {
    test('should update plan', async () => {
      // Create test plan
      const plan = await featuredPlansService.createPlan({
        name: 'پلن اولیه',
        name_en: 'initial_plan',
        duration_days: 1,
        price: 50000,
        features: [],
        is_active: true
      });

      // Update plan
      const updated = await featuredPlansService.updatePlan(plan.id, {
        name: 'پلن بروز شده',
        price: 60000
      });

      expect(updated.name).toBe('پلن بروز شده');
      expect(updated.price).toBe(60000);
      expect(updated.name_en).toBe('initial_plan'); // unchanged

      // Cleanup
      await featuredPlansService.deletePlan(plan.id);
    });

    test('should throw error for non-existent plan', async () => {
      await expect(featuredPlansService.updatePlan(9999, { name: 'تست' }))
        .rejects.toThrow('پلن مورد نظر یافت نشد');
    });
  });

  describe('deletePlan', () => {
    test('should delete plan', async () => {
      // Create test plan
      const plan = await featuredPlansService.createPlan({
        name: 'پلن حذفی',
        name_en: 'deletable_plan',
        duration_days: 1,
        price: 50000,
        features: [],
        is_active: true
      });

      // Delete plan
      await featuredPlansService.deletePlan(plan.id);

      // Verify deletion
      await expect(featuredPlansService.getPlanById(plan.id))
        .rejects.toThrow('پلن مورد نظر یافت نشد');
    });

    test('should throw error for non-existent plan', async () => {
      await expect(featuredPlansService.deletePlan(9999))
        .rejects.toThrow('پلن مورد نظر یافت نشد');
    });

    test('should not delete plan in use', async () => {
      // This test would require creating a payment with the plan
      // For now, we'll skip this test
      // TODO: Implement after payment service is ready
    });
  });

  describe('getActivePlans', () => {
    test('should return only active plans', async () => {
      const plans = await featuredPlansService.getActivePlans();
      expect(Array.isArray(plans)).toBe(true);
      plans.forEach(plan => {
        expect(plan.is_active).toBe(true);
      });
    });
  });

  describe('getPlansStats', () => {
    test('should return plans statistics', async () => {
      const stats = await featuredPlansService.getPlansStats();
      expect(stats).toHaveProperty('total_plans');
      expect(stats).toHaveProperty('active_plans');
      expect(stats).toHaveProperty('inactive_plans');
      expect(stats).toHaveProperty('usage_by_plan');
      expect(Array.isArray(stats.usage_by_plan)).toBe(true);
    });
  });
});
