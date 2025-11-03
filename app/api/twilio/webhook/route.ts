/**
 * Twilio AMD Webhook Handler
 * Processes Twilio status callbacks and AMD detection results
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();

// Twilio webhook signature validation
const authToken = process.env.TWILIO_AUTH_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-twilio-signature') || '';
    const url = request.url;

    // Validate Twilio webhook signature for security
    const isValidSignature = twilio.validateRequest(
      authToken,
      signature,
      url,
      body
    );

    if (!isValidSignature) {
      console.error('Invalid Twilio webhook signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data from Twilio webhook
    const formData = new URLSearchParams(body);
    const webhookData = Object.fromEntries(formData.entries());

    console.log('Twilio webhook received:', webhookData);

    const {
      CallSid,
      CallStatus,
      AnsweringMachineDetectionStatus,
      CallDuration,
      From,
      To,
    } = webhookData;

    if (!CallSid) {
      return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
    }

    // Find the call record in database
    const call = await prisma.call.findUnique({
      where: { callSid: CallSid },
    });

    if (!call) {
      console.error(`Call not found for SID: ${CallSid}`);
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    // Process AMD detection results
    let detectionResult = null;
    let confidence = null;

    if (AnsweringMachineDetectionStatus) {
      switch (AnsweringMachineDetectionStatus) {
        case 'human':
          detectionResult = 'HUMAN';
          confidence = 0.9; // High confidence for human detection
          console.log(`Human detected for call ${CallSid}`);
          break;
        case 'machine_start':
          detectionResult = 'MACHINE';
          confidence = 0.85; // High confidence for machine start
          console.log(`Machine detected (start) for call ${CallSid}`);
          break;
        case 'machine_end_beep':
          detectionResult = 'MACHINE';
          confidence = 0.95; // Very high confidence for machine end beep
          console.log(`Machine detected (end beep) for call ${CallSid}`);
          break;
        case 'machine_end_silence':
          detectionResult = 'MACHINE';
          confidence = 0.8; // Good confidence for machine end silence
          console.log(`Machine detected (end silence) for call ${CallSid}`);
          break;
        case 'machine_end_other':
          detectionResult = 'MACHINE';
          confidence = 0.75; // Moderate confidence for other machine end
          console.log(`Machine detected (other) for call ${CallSid}`);
          break;
        default:
          detectionResult = 'UNDECIDED';
          confidence = 0.5;
          console.log(`Undecided AMD result for call ${CallSid}: ${AnsweringMachineDetectionStatus}`);
      }
    }

    // Map Twilio call status to our enum
    let callStatus = call.status;
    switch (CallStatus) {
      case 'initiated':
        callStatus = 'INITIATED';
        break;
      case 'ringing':
        callStatus = 'RINGING';
        break;
      case 'in-progress':
        callStatus = 'ANSWERED';
        break;
      case 'completed':
        callStatus = 'COMPLETED';
        break;
      case 'failed':
      case 'canceled':
        callStatus = 'FAILED';
        break;
      case 'busy':
        callStatus = 'BUSY';
        break;
      case 'no-answer':
        callStatus = 'NO_ANSWER';
        break;
    }

    // Update call record with AMD results and status
    const updatedCall = await prisma.call.update({
      where: { callSid: CallSid },
      data: {
        status: callStatus,
        detectionResult: detectionResult || undefined,
        confidence: confidence || undefined,
        duration: CallDuration ? parseInt(CallDuration) : undefined,
        updatedAt: new Date(),
      },
    });

    console.log(`Updated call ${CallSid}:`, {
      status: callStatus,
      detectionResult,
      confidence,
      duration: CallDuration,
    });

    // If machine detected, we might want to hang up the call
    // This is handled in the frontend via WebSocket updates

    return NextResponse.json({ 
      success: true, 
      callId: updatedCall.id,
      detectionResult,
      confidence 
    });

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}