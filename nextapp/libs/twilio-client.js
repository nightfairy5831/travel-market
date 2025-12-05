import twilio from 'twilio';


export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,  
  process.env.TWILIO_AUTH_TOKEN    
);

export { twilio };

export const isTwilioConfigured = () => {
  return !!(process.env.TWILIO_ACCOUNT_SID && 
           process.env.TWILIO_AUTH_TOKEN && 
           process.env.TWILIO_PHONE_NUMBER);
};


export const getTwilioConfig = () => {
  return {
    hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
    isFullyConfigured: !!(process.env.TWILIO_ACCOUNT_SID && 
                         process.env.TWILIO_AUTH_TOKEN && 
                         process.env.TWILIO_PHONE_NUMBER)
  };
};