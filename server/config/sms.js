const axios = require('axios');

// SMS Configuration
const smsConfig = {
  provider: process.env.SMS_PROVIDER || 'smsir', // smsir, kavenegar, ghasedak
  apiKey: process.env.SMS_API_KEY,
  sender: process.env.SMS_SENDER || '10008663',
  
  // SMS.ir config
  smsir: {
    baseUrl: 'https://api.sms.ir/v1',
    apiKey: process.env.SMSIR_API_KEY,
    templateId: process.env.SMSIR_TEMPLATE_ID || '100000' // شناسه قالب OTP
  },
  
  // Kavenegar config
  kavenegar: {
    baseUrl: 'https://api.kavenegar.com/v1',
    apiKey: process.env.KAVENEGAR_API_KEY
  },
  
  // Ghasedak config
  ghasedak: {
    baseUrl: 'https://api.ghasedak.me/v2',
    apiKey: process.env.GHASEDAK_API_KEY
  }
};

// Check if SMS is configured
function isSMSConfigured() {
  return !!(smsConfig.apiKey || smsConfig.smsir.apiKey || smsConfig.kavenegar.apiKey || smsConfig.ghasedak.apiKey);
}

// Send SMS via SMS.ir
async function sendViaSMSir(receptor, message) {
  try {
    // Clean phone number - SMS.ir needs format: 09xxxxxxxxx
    let cleanReceptor = receptor.replace(/\D/g, '');
    if (cleanReceptor.startsWith('98')) {
      cleanReceptor = '0' + cleanReceptor.substring(2);
    } else if (!cleanReceptor.startsWith('0')) {
      cleanReceptor = '0' + cleanReceptor;
    }

    // Extract 6-digit code from message
    const codeMatch = message.match(/\d{6}/);
    const code = codeMatch ? codeMatch[0] : message;

    console.log(`[SMS.ir] Sending to ${cleanReceptor}, code: ${code}, template: ${smsConfig.smsir.templateId}`);

    const url = `${smsConfig.smsir.baseUrl}/send/verify`;
    
    const payload = {
      mobile: cleanReceptor,
      templateId: parseInt(smsConfig.smsir.templateId),
      parameters: [
        {
          name: 'CODE',
          value: code
        }
      ]
    };

    console.log('[SMS.ir] Request payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(url, payload, {
      headers: {
        'X-API-KEY': smsConfig.smsir.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('[SMS.ir] Response:', response.data);

    return {
      success: response.data.status === 1,
      messageId: response.data.messageId,
      data: response.data
    };
  } catch (error) {
    console.error('[SMS.ir] Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Send SMS via Kavenegar
async function sendViaKavenegar(receptor, message) {
  try {
    const url = `${smsConfig.kavenegar.baseUrl}/${smsConfig.kavenegar.apiKey}/sms/send.json`;
    
    const response = await axios.post(url, {
      receptor,
      sender: smsConfig.sender,
      message
    });

    return {
      success: response.data.return.status === 200,
      messageId: response.data.entries?.[0]?.messageid,
      data: response.data
    };
  } catch (error) {
    console.error('Kavenegar error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.return?.message || error.message
    };
  }
}

// Send SMS via Ghasedak
async function sendViaGhasedak(receptor, message) {
  try {
    const url = `${smsConfig.ghasedak.baseUrl}/sms/send/simple`;
    
    const response = await axios.post(url, {
      receptor,
      message,
      linenumber: smsConfig.sender
    }, {
      headers: {
        'apikey': smsConfig.ghasedak.apiKey
      }
    });

    return {
      success: response.data.result?.code === 200,
      messageId: response.data.result?.items?.[0]?.id,
      data: response.data
    };
  } catch (error) {
    console.error('Ghasedak error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

// Send SMS (auto-detect provider)
async function sendSMS(receptor, message, allowMock = false) {
  console.log(`[sendSMS] allowMock=${allowMock}, isSMSConfigured=${isSMSConfigured()}`);
  
  // In development mode without SMS config, use mock if allowed
  if (!isSMSConfigured() && allowMock) {
    console.log(`📱 [MOCK SMS] to ${receptor}: ${message.substring(0, 50)}...`);
    return { 
      success: true, 
      mock: true,
      message: 'Mock SMS sent (development mode)'
    };
  }
  
  if (!isSMSConfigured()) {
    console.warn('⚠️  SMS not configured, skipping send');
    return { success: false, error: 'SMS not configured' };
  }

  console.log(`📱 Sending SMS to ${receptor} via ${smsConfig.provider}`);

  // Try configured provider
  if (smsConfig.provider === 'smsir' && smsConfig.smsir.apiKey) {
    return await sendViaSMSir(receptor, message);
  } else if (smsConfig.kavenegar.apiKey) {
    return await sendViaKavenegar(receptor, message);
  } else if (smsConfig.ghasedak.apiKey) {
    return await sendViaGhasedak(receptor, message);
  }

  return { success: false, error: 'No SMS provider configured' };
}

// Send OTP SMS
async function sendOTP(phone, code) {
  // In development mode without SMS config, use mock
  const allowMock = String(process.env.OTP_MOCK ?? 'true').toLowerCase() === 'true';
  console.log(`[sendOTP] allowMock=${allowMock}, OTP_MOCK env=${process.env.OTP_MOCK}`);
  
  const message = `کد تایید شما: ${code}\nگاراژ سنگین`;
  const result = await sendSMS(phone, message, allowMock);
  
  // Add code to result in mock mode for development
  if (result.mock && allowMock) {
    result.code = code;
    console.log(`📱 [MOCK OTP] Code for ${phone}: ${code}`);
  }
  
  return result;
}

// Send template SMS (Kavenegar)
async function sendTemplate(receptor, template, params) {
  if (!smsConfig.kavenegar.apiKey) {
    return { success: false, error: 'Template SMS only available with Kavenegar' };
  }

  try {
    const url = `${smsConfig.kavenegar.baseUrl}/${smsConfig.kavenegar.apiKey}/verify/lookup.json`;
    
    const response = await axios.post(url, {
      receptor,
      template,
      ...params
    });

    return {
      success: response.data.return.status === 200,
      messageId: response.data.entries?.[0]?.messageid,
      data: response.data
    };
  } catch (error) {
    console.error('Template SMS error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.return?.message || error.message
    };
  }
}

module.exports = {
  sendSMS,
  sendOTP,
  sendTemplate,
  isSMSConfigured,
  smsConfig
};
