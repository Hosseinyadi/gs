const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔧 Fixing CORS configuration...\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found, creating from .env.example...');
  const examplePath = path.join(__dirname, '.env.example');
  if (fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('✅ .env file created');
  } else {
    console.error('❌ .env.example not found!');
    process.exit(1);
  }
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Update CORS settings
const updates = {
  'NODE_ENV': 'development',
  'ALLOWED_ORIGINS': 'http://localhost:5173,http://localhost:3000',
  'FRONTEND_URL': 'http://localhost:5173',
  'OTP_MOCK': 'true'
};

let modified = false;

Object.entries(updates).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    const oldLine = envContent.match(regex)[0];
    const newLine = `${key}=${value}`;
    if (oldLine !== newLine) {
      envContent = envContent.replace(regex, newLine);
      console.log(`✓ Updated: ${key}=${value}`);
      modified = true;
    }
  } else {
    envContent += `\n${key}=${value}`;
    console.log(`✓ Added: ${key}=${value}`);
    modified = true;
  }
});

if (modified) {
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ CORS configuration updated!');
  console.log('⚠️  Please restart the backend server for changes to take effect.');
} else {
  console.log('\n✅ CORS configuration is already correct.');
}
