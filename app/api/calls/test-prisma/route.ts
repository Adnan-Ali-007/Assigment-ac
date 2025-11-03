/**
 * Test Prisma Database Connection
 */

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== PRISMA TEST START ===');
    
    // Step 1: Test Prisma import
    console.log('✓ Testing Prisma import...');
    const { PrismaClient } = await import('@prisma/client');
    console.log('✓ Prisma imported successfully');
    
    // Step 2: Test Prisma client creation
    console.log('✓ Creating Prisma client...');
    const prisma = new PrismaClient();
    console.log('✓ Prisma client created');
    
    // Step 3: Test database connection
    console.log('✓ Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected');
    
    // Step 4: Test user query
    console.log('✓ Testing user query...');
    const user = await prisma.user.findUnique({
      where: { id: 'demo-user-123' }
    });
    console.log('✓ User found:', user?.email);
    
    // Step 5: Test call creation
    console.log('✓ Testing call creation...');
    const call = await prisma.call.create({
      data: {
        userId: 'demo-user-123',
        targetNumber: '+18007742678',
        amdStrategy: 'twilio-native',
        status: 'INITIATED',
      },
    });
    console.log('✓ Call created:', call.id);
    
    // Clean up - delete the test call
    await prisma.call.delete({
      where: { id: call.id }
    });
    console.log('✓ Test call cleaned up');
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      message: 'Prisma tests passed!',
      user: user?.email,
      testCallId: call.id
    });
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error);
    return NextResponse.json({
      error: 'Prisma test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}