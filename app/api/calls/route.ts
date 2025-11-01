import { NextResponse } from 'next/server';
import { fetchCallLogs, createCallLog as createLog } from '@/lib/data';
import { CallLog } from '@/types';

export async function GET() {
  try {
    const logs = await fetchCallLogs();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch call logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const logData = (await request.json()) as Omit<CallLog, 'id' | 'timestamp'>;
        if (!logData.phoneNumber || !logData.strategy) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }
        const newLog = await createLog(logData);
        return NextResponse.json(newLog, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to create call log' }, { status: 500 });
    }
}
