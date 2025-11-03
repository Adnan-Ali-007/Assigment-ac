/**
 * Call Initiation API Endpoint
 * Handles outbound call requests with AMD detection
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

export async function POST(request: NextRequest) {
  try {
    console.log('=== CALL INITIATION START ===');
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request data
    const validatedData = initiateCallSchema.parse(body);
    const { targetNumber, amdStrategy, userId } = validatedData;
    console.log('Validated data:', { targetNumber, amdStrategy, userId });

    // Simple phone formatting for demo
    const formattedNumber = targetNumber.startsWith('+') ? targetNumber : `+1${targetNumber.replace(/\D/g, '')}`;
    console.log('Formatted number:', formattedNumber);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create call record in database
    const call = await prisma.call.create({
      data: {
        userId,
        targetNumber: formattedNumber,
        amdStrategy,
        status: 'INITIATED',
      },
    });

    console.log(`Created call record: ${call.id} for user: ${userId}`);

    // Get Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return NextResponse.json({ error: 'Missing Twilio credentials' }, { status: 500 });
    }

    // Create Twilio client and make call
    const client = twilio(accountSid, authToken);
    console.log('Initiating Twilio call...');
    
    const twilioCall = await client.calls.create({
      to: formattedNumber,
      from: twilioPhoneNumber,
      url: `${process.env.BETTER_AUTH_URL}/api/twilio/twiml`,
      statusCallback: `${process.env.BETTER_AUTH_URL}/api/twilio/webhook`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: 'Enable',
      machineDetectionTimeout: 30,
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

    console.log(`Initiated Twilio call: ${twilioCall.sid} for call record: ${call.id}`);

    return NextResponse.json({
      success: true,
      callId: updatedCall.id,
      callSid: twilioCall.sid,
      status: updatedCall.status,
      targetNumber: formattedNumber,
      amdStrategy,
    });

  } catch (error) {
    console.error('Error initiating call:', error);

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

// Rate limiting check (simple implementation)
const callAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_CALLS_PER_MINUTE = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userAttempts = callAttempts.get(userId);

  if (!userAttempts) {
    callAttempts.set(userId, { count: 1, lastAttempt: now });
    return true;
  }

  // Reset counter if window has passed
  if (now - userAttempts.lastAttempt > RATE_LIMIT_WINDOW) {
    callAttempts.set(userId, { count: 1, lastAttempt: now });
    return true;
  }

  // Check if under limit
  if (userAttempts.count < MAX_CALLS_PER_MINUTE) {
    userAttempts.count++;
    userAttempts.lastAttempt = now;
    return true;
  }

  return false;
}