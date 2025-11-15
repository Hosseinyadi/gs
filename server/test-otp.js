require('dotenv').config();
const smsService = require('./services/smsService');

async function testOTP() {
  console.log('='.repeat(60));
  console.log('🧪 OTP Test Script');
  console.log('='.repeat(60));
  
  // Get phone number from command line or use default
  const phone = process.argv[2] || '09123456789';
  const cleanPhone = smsService.cleanPhoneNumber(phone);
  
  console.log('\n📱 Phone Number:', phone);
  console.log('🧹 Cleaned Phone:', cleanPhone);
  console.log('✅ Valid:', smsService.isValidPhoneNumber(phone));
  
  // Generate OTP
  const otpCode = smsService.generateOTP();
  console.log('\n🔢 Generated OTP:', otpCode);
  
  // Check SMS configuration
  console.log('\n⚙️  SMS Configuration:');
  console.log('   Provider:', process.env.SMS_PROVIDER);
  console.log('   API Key:', process.env.SMSIR_API_KEY ? '✅ Set' : '❌ Not Set');
  console.log('   Template ID:', process.env.SMSIR_TEMPLATE_ID);
  console.log('   OTP Mock:', process.env.OTP_MOCK);
  console.log('   SMS Configured:', smsService.isSMSConfigured() ? '✅ Yes' : '❌ No');
  
  // Send OTP
  console.log('\n📤 Sending OTP...');
  try {
    const result = await smsService.sendVerificationCode(cleanPhone, otpCode);
    
    console.log('\n📊 Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS! OTP sent successfully');
      if (result.mock) {
        console.log('⚠️  Note: This was a MOCK send (development mode)');
        console.log(`   Your OTP code is: ${otpCode}`);
      }
    } else {
      console.log('\n❌ FAILED! Could not send OTP');
      console.log('   Error:', result.error);
    }
  } catch (error) {
    console.error('\n💥 Exception:', error.message);
    console.error(error);
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run test
testOTP().catch(console.error);
