/**
 * Test Twilio Connection
 * Simple endpoint to test if Twilio credentials are working
 */

import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        { 
          error: 'Missing Twilio environment variables',
          missing: {
            accountSid: !accountSid,
            authToken: !authToken,
            phoneNumber: !twilioPhoneNumber
          }
        },
        { status: 400 }
      );
    }

    // Test Twilio connection
    const client = twilio(accountSid, authToken);
    
    // Try to fetch account info
    const account = await client.api.accounts(accountSid).fetch();
    
    // Try to fetch phone numbers
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });

    return NextResponse.json({
      success: true,
      account: {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
      },
      configuredPhoneNumber: twilioPhoneNumber,
      availablePhoneNumbers: phoneNumbers.map(num => ({
        sid: num.sid,
        phoneNumber: num.phoneNumber,
        friendlyName: num.friendlyName,
      })),
    });

  } catch (error) {
    console.error('Twilio test error:', error);
    return NextResponse.json(
      { 
        error: 'Twilio connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}