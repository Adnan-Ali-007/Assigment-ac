/**
 * Demo Call Initiation - Simulates all AMD strategies
 * Works without real Twilio calls for demonstration
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { createDetector } from '@/lib/amdStrategies';

const prisma = new PrismaClient();

const initiateCallSchema = z.object({
  targetNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  amdStrategy: z.string().default('twilio-native'),
  userId: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEMO CALL INITIATION START ===');
    const body = await request.json();
    console.log('Request body:', body);
    
    const validatedData = initiateCallSchema.parse(body);
    const { targetNumber, amdStrategy, userId } = validatedData;
    
    // Format phone number
    const formattedNumber = targetNumber.startsWith('+') ? targetNumber : `+1${targetNumber.replace(/\D/g, '')}`;
    
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create call record
    const call = await prisma.call.create({
      data: {
        userId,
        targetNumber: formattedNumber,
        amdStrategy,
        status: 'INITIATED',
      },
    });

    console.log(`Created demo call record: ${call.id} with strategy: ${amdStrategy}`);

    // Simulate call progression with the selected AMD strategy
    setTimeout(async () => {
      await simulateCallProgression(call.id, amdStrategy, formattedNumber);
    }, 1000);

    return NextResponse.json({
      success: true,
      callId: call.id,
      callSid: `demo_${call.id}`,
      status: 'INITIATED',
      targetNumber: formattedNumber,
      amdStrategy,
      demo: true
    });

  } catch (error) {
    console.error('Demo call initiation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initiate demo call', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function simulateCallProgression(callId: string, strategy: string, targetNumber: string) {
  try {
    console.log(`Simulating call progression for ${callId} with ${strategy}`);
    
    // Step 1: Ringing (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500));
    await prisma.call.update({
      where: { id: callId },
      data: { status: 'RINGING', updatedAt: new Date() }
    });
    console.log(`Call ${callId}: RINGING`);

    // Step 2: Answered (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1800));
    await prisma.call.update({
      where: { id: callId },
      data: { status: 'ANALYZING', updatedAt: new Date() }
    });
    console.log(`Call ${callId}: ANALYZING with ${strategy}`);

    // Step 3: AMD Processing with selected strategy
    const detector = createDetector(strategy);
    const mockAudioBuffer = Buffer.alloc(1024); // Mock audio data
    const amdResult = await detector.processStream(mockAudioBuffer);
    
    console.log(`AMD Result for ${strategy}:`, amdResult);

    // Determine final status based on AMD result
    let finalStatus = 'COMPLETED';
    
    // For demo purposes, make certain numbers always trigger machine detection
    const machineNumbers = ['18007742678', '18008066453', '18882211161']; // Costco, Nike, PayPal
    const cleanNumber = targetNumber.replace(/\D/g, '');
    
    let finalResult = amdResult.result;
    let finalConfidence = amdResult.confidence;
    
    if (machineNumbers.some(num => cleanNumber.includes(num.slice(1)))) {
      // Force machine detection for known voicemail numbers
      finalResult = 'machine';
      finalConfidence = Math.max(0.85, amdResult.confidence);
    }

    // Step 4: Update with final AMD result
    await prisma.call.update({
      where: { id: callId },
      data: {
        status: finalStatus,
        detectionResult: finalResult.toUpperCase(),
        confidence: finalConfidence,
        duration: finalResult === 'human' ? Math.floor(Math.random() * 120) + 30 : 0, // Random duration for humans
        updatedAt: new Date()
      }
    });

    console.log(`Call ${callId} completed: ${finalResult} (confidence: ${finalConfidence})`);
    
    // Log strategy performance
    console.log(`Strategy Performance - ${strategy}:`, {
      result: finalResult,
      confidence: finalConfidence,
      processingTime: amdResult.processingTime,
      targetNumber: targetNumber
    });

  } catch (error) {
    console.error(`Error simulating call progression for ${callId}:`, error);
    
    // Mark call as failed
    await prisma.call.update({
      where: { id: callId },
      data: {
        status: 'FAILED',
        updatedAt: new Date()
      }
    });
  }
}