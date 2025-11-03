import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Simple test endpoint called');
    return NextResponse.json({ success: true, message: 'Test endpoint works' });
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}