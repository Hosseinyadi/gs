const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { dbHelpers } = require('../config/database');
const smsService = require('../services/smsService');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Send OTP for registration/login
router.post('/send-otp', [
    body('phone')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است')
        .isLength({ min: 10, max: 15 })
        .withMessage('شماره موبایل باید بین 10 تا 15 رقم باشد')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { phone } = req.body;
        const cleanPhone = smsService.cleanPhoneNumber(phone);

        console.log('[Send OTP] Request:', { phone, cleanPhone });

        // Invalidate all previous OTPs for this phone
        await dbHelpers.run(
            'UPDATE otp_verifications SET is_used = 1 WHERE phone = ? AND is_used = 0',
            [cleanPhone]
        );
        console.log('[Send OTP] Previous OTPs invalidated for:', cleanPhone);

        // Generate OTP
        const otpCode = smsService.generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        console.log('[Send OTP] Generated:', { otpCode, expiresAt });

        // Save OTP to database
        const result = await dbHelpers.run(
            'INSERT INTO otp_verifications (phone, otp_code, expires_at) VALUES (?, ?, ?)',
            [cleanPhone, otpCode, expiresAt]
        );

        console.log('[Send OTP] Saved to DB:', { id: result.id, phone: cleanPhone, code: otpCode });

        // Send SMS
        const smsResult = await smsService.sendVerificationCode(cleanPhone, otpCode);

        console.log('[Send OTP] SMS Result:', {
            success: smsResult.success,
            mock: smsResult.mock,
            error: smsResult.error
        });

        if (smsResult.success) {
            if (smsResult.mock) {
                console.log(`📱 [MOCK OTP] to ${cleanPhone}: ${otpCode}`);
            } else {
                console.log(`✅ [SMS SENT] to ${cleanPhone}`);
            }
            return res.json({
                success: true,
                message: 'کد تایید ارسال شد',
                expiresIn: 300, // 5 minutes in seconds
                ...(smsResult.mock && { debug: { code: otpCode } }) // فقط در حالت mock
            });
        }

        // اگر SMS.ir در دسترس نیست، از حالت mock استفاده کن
        console.warn('⚠️ [SMS FAILED - Using MOCK]:', smsResult.error);
        console.log(`📱 [FALLBACK MOCK OTP] to ${cleanPhone}: ${otpCode}`);
        
        return res.json({
            success: true,
            message: 'کد تایید ارسال شد (حالت توسعه)',
            expiresIn: 300,
            debug: { 
                code: otpCode,
                note: 'SMS.ir در دسترس نیست - کد در لاگ سرور'
            }
        });

    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Verify OTP and login/register
router.post('/verify-otp', [
    body('phone')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('کد تایید باید 6 رقم باشد')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { phone, otp, name } = req.body;
        const cleanPhone = smsService.cleanPhoneNumber(phone);

        console.log('[Verify OTP] Request:', { phone, cleanPhone, otp, name });

        // Verify OTP - check all records first for debugging
        const allOtps = await dbHelpers.all(
            'SELECT * FROM otp_verifications WHERE phone = ? ORDER BY created_at DESC LIMIT 5',
            [cleanPhone]
        );
        console.log('[Verify OTP] All OTPs for phone:', allOtps);

        // Verify OTP with more lenient time check
        const otpRecord = await dbHelpers.get(
            `SELECT *, 
                    datetime('now') as current_time,
                    datetime(expires_at) as exp_time,
                    julianday(expires_at) - julianday('now') as time_diff
             FROM otp_verifications 
             WHERE phone = ? AND otp_code = ? AND is_used = 0 
             ORDER BY created_at DESC LIMIT 1`,
            [cleanPhone, otp]
        );

        console.log('[Verify OTP] Found record:', otpRecord);

        if (!otpRecord) {
            console.log('[Verify OTP] No matching OTP found');
            return res.status(400).json({
                success: false,
                message: 'کد تایید نامعتبر است'
            });
        }

        // Check if expired (time_diff will be negative if expired)
        if (otpRecord.time_diff < 0) {
            console.log('[Verify OTP] OTP expired:', otpRecord.time_diff);
            return res.status(400).json({
                success: false,
                message: 'کد تایید منقضی شده است'
            });
        }

        // Mark OTP as used
        await dbHelpers.run(
            'UPDATE otp_verifications SET is_used = 1 WHERE id = ?',
            [otpRecord.id]
        );

        // Check if user exists
        let user = await dbHelpers.get(
            'SELECT * FROM users WHERE phone = ?',
            [cleanPhone]
        );

        if (!user) {
            // Create new user - name is required for registration
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'نام برای ثبت‌نام الزامی است',
                    requiresName: true
                });
            }
            
            const result = await dbHelpers.run(
                'INSERT INTO users (phone, name, is_verified) VALUES (?, ?, 1)',
                [cleanPhone, name.trim()]
            );
            
            console.log('[Verify OTP] New user created:', { id: result.id, phone: cleanPhone, name: name.trim() });
            
            user = await dbHelpers.get(
                'SELECT id, phone, name, email, avatar, is_verified FROM users WHERE id = ?',
                [result.id]
            );
        } else {
            // Existing user - just login (name not required)
            console.log('[Verify OTP] Existing user login:', { id: user.id, phone: cleanPhone });
            
            // Update verification status and name if provided
            if (name && name.trim() !== '') {
                await dbHelpers.run(
                    'UPDATE users SET is_verified = 1, name = ? WHERE id = ?',
                    [name.trim(), user.id]
                );
                user.name = name.trim();
            } else {
                await dbHelpers.run(
                    'UPDATE users SET is_verified = 1 WHERE id = ?',
                    [user.id]
                );
            }
            user.is_verified = 1;
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            phone: user.phone,
            role: 'user'
        });

        res.json({
            success: true,
            message: 'ورود موفقیت‌آمیز',
            data: {
                user: {
                    id: user.id,
                    phone: user.phone,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    is_verified: user.is_verified
                },
                token
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Admin login
router.post('/admin/login', [
    body('username').notEmpty().withMessage('نام کاربری الزامی است'),
    body('password').notEmpty().withMessage('رمز عبور الزامی است')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Get admin user
        const admin = await dbHelpers.get(
            'SELECT * FROM admin_users WHERE username = ? AND is_active = 1',
            [username]
        );

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'نام کاربری یا رمز عبور اشتباه است'
            });
        }

        // Generate token
        const token = generateToken({
            adminId: admin.id,
            username: admin.username,
            role: 'admin'
        });

        res.json({
            success: true,
            message: 'ورود ادمین موفقیت‌آمیز',
            data: {
                admin: {
                    id: admin.id,
                    username: admin.username,
                    name: admin.name,
                    role: admin.role,
                    is_super_admin: admin.is_super_admin
                },
                token
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'توکن احراز هویت الزامی است'
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bil-flow-secret-key-2024');
        
        const user = await dbHelpers.get(
            'SELECT id, phone, name, email, avatar, is_verified, created_at FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'کاربر یافت نشد'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Update user profile
router.put('/profile', [
    body('name').optional({ checkFalsy: true }).isLength({ min: 2 }).withMessage('نام باید حداقل 2 کاراکتر باشد'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('ایمیل معتبر نیست')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'توکن احراز هویت الزامی است'
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bil-flow-secret-key-2024');
        
        const { name, email, avatar } = req.body;
        const updateFields = [];
        const updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        if (avatar) {
            updateFields.push('avatar = ?');
            updateValues.push(avatar);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'هیچ فیلدی برای به‌روزرسانی ارسال نشده است'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(decoded.userId);

        await dbHelpers.run(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        const updatedUser = await dbHelpers.get(
            'SELECT id, phone, name, email, avatar, is_verified FROM users WHERE id = ?',
            [decoded.userId]
        );

        res.json({
            success: true,
            message: 'پروفایل با موفقیت به‌روزرسانی شد',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

// Login/Register with password (6 digits)
router.post('/login-password', [
    body('phone')
        .notEmpty()
        .withMessage('شماره موبایل الزامی است'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('رمز عبور باید حداقل 6 کاراکتر باشد')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ورودی نامعتبر است',
                errors: errors.array()
            });
        }

        const { phone, password, name } = req.body;
        const cleanPhone = smsService.cleanPhoneNumber(phone);

        console.log('[Password Login] Request:', { phone: cleanPhone, hasName: !!name });

        // Check if user exists
        let user = await dbHelpers.get(
            'SELECT * FROM users WHERE phone = ?',
            [cleanPhone]
        );

        if (user) {
            // User exists - verify password
            if (!user.password_hash) {
                return res.status(400).json({
                    success: false,
                    message: 'این حساب با رمز عبور ایجاد نشده است. لطفاً از روش OTP استفاده کنید'
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'رمز عبور اشتباه است'
                });
            }

            // Generate token
            const token = generateToken({
                userId: user.id,
                phone: user.phone,
                role: 'user'
            });

            // Remove password from response
            delete user.password_hash;

            console.log('[Password Login] Success:', { userId: user.id });

            return res.json({
                success: true,
                message: 'ورود موفقیت‌آمیز',
                data: {
                    user: {
                        id: user.id,
                        phone: user.phone,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        is_verified: user.is_verified
                    },
                    token
                }
            });
        } else {
            // New user - register with password
            if (!name || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'نام الزامی است برای ثبت‌نام'
                });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create new user
            const result = await dbHelpers.run(
                'INSERT INTO users (phone, name, password_hash, is_verified) VALUES (?, ?, ?, 1)',
                [cleanPhone, name.trim(), passwordHash]
            );

            const newUser = await dbHelpers.get(
                'SELECT id, phone, name, email, avatar, is_verified FROM users WHERE id = ?',
                [result.id]
            );

            // Generate token
            const token = generateToken({
                userId: newUser.id,
                phone: newUser.phone,
                role: 'user'
            });

            console.log('[Password Register] Success:', { userId: newUser.id });

            return res.json({
                success: true,
                message: 'ثبت‌نام موفقیت‌آمیز',
                data: {
                    user: newUser,
                    token
                }
            });
        }

    } catch (error) {
        console.error('Password login error:', error);
        res.status(500).json({
            success: false,
            message: 'خطای سرور'
        });
    }
});

module.exports = router;
