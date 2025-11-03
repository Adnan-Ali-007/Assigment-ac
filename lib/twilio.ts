/**
 * Twilio Service Wrapper
 * Handles Twilio SDK operations for call management and AMD
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken || !twilioPhoneNumber) {
  throw new Error('Missing required Twilio environment variables');
}

// Initialize Twilio client
const client = twilio(accountSid, authToken);

export interface CallOptions {
  to: string;
  from?: string;
  statusCallback?: string;
  statusCallbackEvent?: string[];
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  machineDetectionTimeout?: number;
  machineDetectionSpeechThreshold?: number;
  machineDetectionSpeechEndThreshold?: number;
  machineDetectionSilenceTimeout?: number;
}

export interface CallResult {
  callSid: string;
  status: string;
  to: string;
  from: string;
}

/**
 * Initiates an outbound call with AMD enabled
 */
export async function initiateCall(options: CallOptions): Promise<CallResult> {
  try {
    const call = await client.calls.create({
      to: options.to,
      from: options.from || twilioPhoneNumber,
      url: `${process.env.BETTER_AUTH_URL}/api/twilio/twiml`, // TwiML endpoint
      statusCallback: options.statusCallback,
      statusCallbackEvent: options.statusCallbackEvent || ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: options.machineDetection || 'Enable',
      machineDetectionTimeout: options.machineDetectionTimeout || 30,
      machineDetectionSpeechThreshold: options.machineDetectionSpeechThreshold || 2400,
      machineDetectionSpeechEndThreshold: options.machineDetectionSpeechEndThreshold || 1200,
      machineDetectionSilenceTimeout: options.machineDetectionSilenceTimeout || 5000,
    });

    return {
      callSid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
    };
  } catch (error) {
    console.error('Error initiating call:', error);
    throw new Error(`Failed to initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieves call details by SID
 */
export async function getCallDetails(callSid: string) {
  try {
    const call = await client.calls(callSid).fetch();
    return {
      sid: call.sid,
      status: call.status,
      duration: call.duration,
      startTime: call.startTime,
      endTime: call.endTime,
      answeredBy: call.answeredBy,
    };
  } catch (error) {
    console.error('Error fetching call details:', error);
    throw new Error(`Failed to fetch call details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hangs up an active call
 */
export async function hangupCall(callSid: string) {
  try {
    const call = await client.calls(callSid).update({ status: 'completed' });
    return {
      sid: call.sid,
      status: call.status,
    };
  } catch (error) {
    console.error('Error hanging up call:', error);
    throw new Error(`Failed to hang up call: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Support both US and international phone numbers
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // US phone number validation
  const usPhoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  
  // International phone number validation (E.164 format)
  const intlPhoneRegex = /^\+[1-9]\d{1,14}$/;
  
  return usPhoneRegex.test(cleaned) || intlPhoneRegex.test(cleaned);
}

/**
 * Formats phone number to E.164 format
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // If already in E.164 format, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // US number handling
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // For other international numbers, assume they need a + prefix
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}