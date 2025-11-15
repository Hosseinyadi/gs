// Environment Variables Validation
const requiredEnvVars = [
  'JWT_SECRET'
];

const optionalEnvVars = {
  'PORT': '8080',
  'NODE_ENV': 'development',
  'FRONTEND_URL': 'http://localhost:5173',
  'PAYMENT_CALLBACK_URL': 'http://localhost:8080/api/payments/verify',
  'BACKEND_URL': 'http://localhost:8080'
};

function validateEnv() {
  console.log('🔍 Validating environment variables...');
  
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\n💡 Please set these variables in your .env file');
    process.exit(1);
  }
  
  // Set defaults for optional vars
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.log(`⚠️  ${key} not set, using default: ${defaultValue}`);
    }
  });
  
  console.log('✅ All required environment variables are set');
}

module.exports = { validateEnv };
