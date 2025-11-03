/**
 * Call Hangup API Endpoint
 * Hangs up an active call by call ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hangupCall } from '@/lib/twilio';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const { callId } = params;

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // Find the call record
    const call = await prisma.call.findUnique({
      where: { id: callId },
    });

    if (!call || !call.callSid) {
      return NextResponse.json(
        { error: 'Call not found or no Twilio SID available' },
        { status: 404 }
      );
    }

    // Hang up the call via Twilio
    const result = await hangupCall(call.callSid);

    // Update call record
    const updatedCall = await prisma.call.update({
      where: { id: callId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      callId: updatedCall.id,
      callSid: result.sid,
      status: result.status,
    });

  } catch (error) {
    console.error('Error hanging up call:', error);
    return NextResponse.json(
      { error: 'Failed to hang up call', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}