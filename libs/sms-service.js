import { twilioClient, isTwilioConfigured } from '@/libs/twilio-client';

export class SmsService {
  static async sendSMS({ to, body }) {
    try {
      // Check if Twilio is fully configured
      if (!isTwilioConfigured()) {
        console.log('📱 [SIMULATION] SMS would be sent:');
        console.log('📱 To:', to);
        console.log('📱 Message:', body);
        
        return {
          success: true,
          sid: `simulated-${Date.now()}`,
          status: 'simulated',
          message: 'SMS simulation - Twilio not fully configured'
        };
      }

      console.log('📱 Attempting to send SMS to:', to);
      console.log('📱 Message:', body);

      const result = await twilioClient.messages.create({
        body: body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });

      console.log('✅ SMS sent successfully! SID:', result.sid);
      return { 
        success: true, 
        sid: result.sid,
        status: result.status
      };
      
    } catch (error) {
      console.error('❌ SMS error:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Simple test method
  static async sendTestSMS({ to, userName = 'Test User' }) {
    const body = `🧪 Test SMS for ${userName}! This is a test from our app. Timestamp: ${new Date().toLocaleString()}`;
    
    return this.sendSMS({
      to,
      body
    });
  }
}