/**
 * Call Logs API Endpoint
 * Handles fetching call history
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const calls = await prisma.call.findMany({
      orderBy: {
        createdAt: 'desc',
      },
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

    // Transform to match the expected CallLog format
    const callLogs = calls.map(call => ({
      id: call.id,
      phoneNumber: call.targetNumber,
      strategy: call.amdStrategy,
      status: call.status,
      duration: call.duration || 0,
      timestamp: call.createdAt.toISOString(),
      result: call.detectionResult || 'UNKNOWN',
    }));

    return NextResponse.json(callLogs);
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json(
      { message: 'Failed to fetch call logs' }, 
      { status: 500 }
    );
  }
}
