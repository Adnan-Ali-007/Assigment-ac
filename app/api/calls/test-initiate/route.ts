/**
 * Simplified Call Initiation Test
 * Step by step testing to isolate the issue
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST INITIATE START ===');
    
    // Step 1: Test basic request parsing
    const body = await request.json();
    console.log('✓ Request body parsed:', body);
    
    // Step 2: Test environment variables
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
    console.log('✓ Environment variables:', {
      sid: twilioSid ? 'SET' : 'MISSING',
      token: twilioToken ? 'SET' : 'MISSING', 
      phone: twilioPhone || 'MISSING'
    });
    
    if (!twilioSid || !twilioToken || !twilioPhone) {
      return NextResponse.json({
        error: 'Missing Twilio credentials',
        details: {
          sid: !twilioSid,
          token: !twilioToken,
          phone: !twilioPhone
        }
      }, { status: 500 });
    }
    
    // Step 3: Test Twilio import
    console.log('✓ Testing Twilio import...');
    const twilio = await import('twilio');
    console.log('✓ Twilio imported successfully');
    
    // Step 4: Test Twilio client creation
    console.log('✓ Creating Twilio client...');
    const client = twilio.default(twilioSid, twilioToken);
    console.log('✓ Twilio client created');
    
    // Step 5: Test basic Twilio API call (fetch account info)
    console.log('✓ Testing Twilio API connection...');
    const account = await client.api.accounts(twilioSid).fetch();
    console.log('✓ Twilio API connected:', account.friendlyName);
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed!',
      account: account.friendlyName,
      phone: twilioPhone
    });
    
  } catch (error) {
    console.error('❌ Test failed at step:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}