/**
 * Fixed Call Initiation API Endpoint
 * Direct Twilio integration without wrapper
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import twilio from 'twilio';

const prisma = new PrismaClient();

// Request validation schema
const initiateCallSchema = z.object({
  targetNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  amdStrategy: z.string().default('twilio-native'),
  userId: z.string().min(1, 'User ID is required'),
});

// Simple phone validation
function validatePhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  const usPhoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  const intlPhoneRegex = /^\+[1-9]\d{1,14}$/;
  return usPhoneRegex.test(cleaned) || intlPhoneRegex.test(cleaned);
}

// Simple phone formatting
function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('1') && cleaned.length === 11) return `+${cleaned}`;
  if (cleaned.length === 10) return `+1${cleaned}`;
  if (cleaned.length > 10) return `+${cleaned}`;
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== FIXED CALL INITIATION START ===');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request data
    const validatedData = initiateCallSchema.parse(body);
    const { targetNumber, amdStrategy, userId } = validatedData;
    console.log('Validated data:', { targetNumber, amdStrategy, userId });

    // Validate and format phone number
    console.log('Validating phone number:', targetNumber);
    if (!validatePhoneNumber(targetNumber)) {
      console.log('Phone number validation failed');
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const formattedNumber = formatPhoneNumber(targetNumber);
    console.log('Formatted number:', formattedNumber);

    // Get environment variables
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json(
        { error: 'Missing Twilio credentials' },
        { status: 500 }
      );
    }

    // Verify user exists
    console.log('Checking user exists:', userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    console.log('User found:', user.email);

    // Create call record in database
    console.log('Creating call record...');
    const call = await prisma.call.create({
      data: {
        userId,
        targetNumber: formattedNumber,
        amdStrategy,
        status: 'INITIATED',
      },
    });
    console.log(`Created call record: ${call.id}`);

    // Create Twilio client
    console.log('Creating Twilio client...');
    const client = twilio(accountSid, authToken);

    // Initiate Twilio call
    console.log('Initiating Twilio call...');
    const twilioCall = await client.calls.create({
      to: formattedNumber,
      from: twilioPhoneNumber,
      url: `${process.env.BETTER_AUTH_URL}/api/twilio/twiml`,
      statusCallback: `${process.env.BETTER_AUTH_URL}/api/twilio/webhook`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: 'Enable',
      machineDetectionTimeout: 30,
      machineDetectionSpeechThreshold: 2400,
      machineDetectionSpeechEndThreshold: 1200,
      machineDetectionSilenceTimeout: 5000,
    });

    console.log('Twilio call created:', twilioCall.sid);

    // Update call record with Twilio SID
    const updatedCall = await prisma.call.update({
      where: { id: call.id },
      data: {
        callSid: twilioCall.sid,
        status: 'RINGING',
        updatedAt: new Date(),
      },
    });

    console.log(`Updated call record with SID: ${twilioCall.sid}`);

    return NextResponse.json({
      success: true,
      callId: updatedCall.id,
      callSid: twilioCall.sid,
      status: updatedCall.status,
      targetNumber: formattedNumber,
      amdStrategy,
    });

  } catch (error) {
    console.error('❌ Error initiating call:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initiate call', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}