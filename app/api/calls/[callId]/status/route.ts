/**
 * Call Status API Endpoint
 * Returns the current status of a specific call
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
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

    // Fetch call from database
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      call: {
        id: call.id,
        callSid: call.callSid,
        targetNumber: call.targetNumber,
        amdStrategy: call.amdStrategy,
        status: call.status,
        detectionResult: call.detectionResult,
        confidence: call.confidence,
        duration: call.duration,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
        user: call.user,
      },
    });

  } catch (error) {
    console.error('Error fetching call status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch call status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}