import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const env = {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || 'MISSING',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'MISSING',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    };
    
    return NextResponse.json({ env });
  } catch (error) {
    console.error('Env test error:', error);
    return NextResponse.json({ error: 'Env test failed' }, { status: 500 });
  }
}