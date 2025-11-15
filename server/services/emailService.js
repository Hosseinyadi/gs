const { getTransporter, isEmailConfigured } = require('../config/email');

/**
 * Send email
 */
async function sendEmail({ to, subject, html, text }) {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured, skipping send');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: `"گاراژ سنگین" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || subject
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send payment success email
 */
async function sendPaymentSuccessEmail(user, payment, listing) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Tahoma, Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .button { background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; 
                  border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ پرداخت موفق</h1>
        </div>
        <div class="content">
          <p>کاربر گرامی،</p>
          <p>پرداخت شما با موفقیت انجام شد و آگهی شما ویژه شد.</p>
          
          <h3>جزئیات پرداخت:</h3>
          <ul>
            <li><strong>آگهی:</strong> ${listing.title}</li>
            <li><strong>مبلغ:</strong> ${payment.final_amount.toLocaleString('fa-IR')} تومان</li>
            <li><strong>کد پیگیری:</strong> ${payment.ref_id}</li>
          </ul>
          
          <a href="${process.env.FRONTEND_URL}/listings/${listing.id}" class="button">
            مشاهده آگهی
          </a>
          
          <p>با تشکر از انتخاب شما</p>
        </div>
        <div class="footer">
          <p>گاراژ سنگین - سیستم خرید و فروش ماشین‌آلات سنگین</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email || user.phone + '@temp.com',
    subject: '✅ پرداخت موفق - گاراژ سنگین',
    html
  });
}

/**
 * Send featured listing notification
 */
async function sendFeaturedNotification(user, listing, duration) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <body style="font-family: Tahoma, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 8px;">
        <div style="background: #FF9800; color: white; padding: 20px; text-align: center;">
          <h1>⭐ آگهی شما ویژه شد</h1>
        </div>
        <div style="padding: 30px;">
          <p>کاربر گرامی،</p>
          <p>آگهی "${listing.title}" شما برای ${duration} روز ویژه شد و در بالای لیست نمایش داده می‌شود.</p>
          <p>با تشکر از اعتماد شما</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email || user.phone + '@temp.com',
    subject: '⭐ آگهی شما ویژه شد - گاراژ سنگین',
    html
  });
}

/**
 * Send expiring listing warning
 */
async function sendExpiringWarning(user, listing, hoursLeft) {
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <body style="font-family: Tahoma, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 20px auto;">
        <div style="background: #FFC107; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ آگهی شما در حال انقضا</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <p>کاربر گرامی،</p>
          <p>آگهی ویژه "${listing.title}" شما ${hoursLeft} ساعت دیگر منقضی می‌شود.</p>
          <p>برای تمدید، به پنل کاربری خود مراجعه کنید.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email || user.phone + '@temp.com',
    subject: '⚠️ آگهی شما در حال انقضا - گاراژ سنگین',
    html
  });
}

module.exports = {
  sendEmail,
  sendPaymentSuccessEmail,
  sendFeaturedNotification,
  sendExpiringWarning
};
