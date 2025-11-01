import { NextResponse } from 'next/server';
import { signupUser } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    await signupUser(name, email, password);
    return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 });
  } catch (error) {
     if (error instanceof Error) {
        return NextResponse.json({ message: error.message }, { status: 409 }); // 409 Conflict for existing user
    }
    return NextResponse.json({ message: 'An unknown error occurred' }, { status: 500 });
  }
}
