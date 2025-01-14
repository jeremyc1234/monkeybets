import { supabase } from './supabase';

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SID = import.meta.env.VITE_TWILIO_VERIFY_SID;

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/[^\d]/g, '');

  // If number starts with 1, add +, otherwise add +1
  if (cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return `+1${cleaned}`;
}

export async function sendVerificationCode(phoneNumber: string): Promise<void> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Validate US phone number format (10 digits after potential 1)
  const digitsOnly = formattedPhone.replace(/[^\d]/g, '');
  if (digitsOnly.length !== 10 && digitsOnly.length !== 11) {
    throw new Error('Please enter a valid 10-digit US phone number');
  }

  try {
    const response = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/Verifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Channel: 'sms',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio Error Response:', error);
      throw new Error(error.message || 'Failed to send verification code');
    }
  } catch (error) {
    console.error('Twilio API Error:', error);
    throw new Error('Failed to send verification code. Please check your phone number format.');
  }
}

export async function verifyCode(phoneNumber: string, code: string): Promise<boolean> {
  const formattedPhone = formatPhoneNumber(phoneNumber);

  try {
    const response = await fetch(`https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SID}/VerificationCheck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: new URLSearchParams({
        To: formattedPhone,
        Code: code,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio Error Response:', error);
      throw new Error(error.message || 'Failed to verify code');
    }

    const result = await response.json();
    return result.status === 'approved';
  } catch (error) {
    console.error('Twilio API Error:', error);
    throw new Error('Failed to verify code. Please try again.');
  }
}