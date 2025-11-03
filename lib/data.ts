import { AmdStrategy, CallStatus, DetectionResult, type CallLog } from '@/types';
import { prisma } from './prisma';

// Prisma enum types (will be available after running npx prisma generate)
type PrismaCallStatus = 'INITIATED' | 'RINGING' | 'ANSWERED' | 'ANALYZING' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER' | 'BUSY';
type PrismaDetectionResult = 'HUMAN' | 'MACHINE' | 'UNDECIDED';

// Keep mock users for backward compatibility (can be replaced with Better-Auth later)
const users = [
    { id: 'user_1', name: 'Demo User', email: 'user@example.com', password: 'password123' }
];

// Map Prisma CallStatus to app CallStatus
const mapPrismaStatusToAppStatus = (prismaStatus: PrismaCallStatus): CallStatus => {
    switch (prismaStatus) {
        case 'COMPLETED':
            return CallStatus.COMPLETED;
        case 'FAILED':
            return CallStatus.FAILED;
        case 'BUSY':
            return CallStatus.BUSY;
        case 'NO_ANSWER':
            return CallStatus.NO_ANSWER;
        default:
            return CallStatus.FAILED; // Default fallback
    }
};

// Map app CallStatus to Prisma CallStatus
const mapAppStatusToPrismaStatus = (appStatus: CallStatus): PrismaCallStatus => {
    switch (appStatus) {
        case CallStatus.COMPLETED:
            return 'COMPLETED';
        case CallStatus.FAILED:
            return 'FAILED';
        case CallStatus.BUSY:
            return 'BUSY';
        case CallStatus.NO_ANSWER:
            return 'NO_ANSWER';
        default:
            return 'FAILED';
    }
};

// Map Prisma DetectionResult to app DetectionResult
const mapPrismaResultToAppResult = (prismaResult: PrismaDetectionResult | null): DetectionResult => {
    if (!prismaResult) return DetectionResult.UNKNOWN;
    
    switch (prismaResult) {
        case 'HUMAN':
            return DetectionResult.HUMAN;
        case 'MACHINE':
            return DetectionResult.MACHINE;
        case 'UNDECIDED':
            return DetectionResult.UNKNOWN;
        default:
            return DetectionResult.UNKNOWN;
    }
};

// Map app DetectionResult to Prisma DetectionResult
const mapAppResultToPrismaResult = (appResult: DetectionResult): PrismaDetectionResult | null => {
    switch (appResult) {
        case DetectionResult.HUMAN:
            return 'HUMAN';
        case DetectionResult.MACHINE:
            return 'MACHINE';
        case DetectionResult.UNKNOWN:
            return 'UNDECIDED';
        default:
            return 'UNDECIDED';
    }
};

// Transform Prisma Call to CallLog interface
const transformCallToCallLog = (call: {
    id: string;
    targetNumber: string;
    amdStrategy: string;
    status: PrismaCallStatus;
    detectionResult: PrismaDetectionResult | null;
    duration: number | null;
    createdAt: Date;
}): CallLog => {
    return {
        id: call.id,
        phoneNumber: call.targetNumber,
        strategy: call.amdStrategy.toUpperCase().replace('-', '_') as AmdStrategy || AmdStrategy.TWILIO_NATIVE,
        status: mapPrismaStatusToAppStatus(call.status),
        duration: call.duration || 0,
        timestamp: call.createdAt.toISOString(),
        result: mapPrismaResultToAppResult(call.detectionResult),
    };
};

export const loginUser = async (email: string, password: string) => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    throw new Error('Invalid email or password.');
};

export const signupUser = async (name: string, email: string, password: string) => {
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        throw new Error('Email address is already in use.');
    }
    const newUser = {
        id: `user_${Date.now()}`,
        name,
        email,
        password
    };
    users.push(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};

export const fetchCallLogs = async (userId?: string): Promise<CallLog[]> => {
    try {
        const calls = await prisma.call.findMany({
            where: userId ? { userId } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to recent 100 calls
        });
        
        return calls.map(transformCallToCallLog);
    } catch (error) {
        console.error('Error fetching call logs:', error);
        // Fallback to empty array if database error
        return [];
    }
};

export const createCallLog = async (
    logData: Omit<CallLog, 'id' | 'timestamp'>,
    userId: string = 'user_1' // Default user, should come from auth in production
): Promise<CallLog> => {
    try {
        const call = await prisma.call.create({
            data: {
                userId,
                targetNumber: logData.phoneNumber,
                amdStrategy: logData.strategy.toLowerCase().replace('_', '-'),
                status: mapAppStatusToPrismaStatus(logData.status),
                detectionResult: mapAppResultToPrismaResult(logData.result),
                duration: logData.duration,
            },
        });

        return transformCallToCallLog(call);
    } catch (error) {
        console.error('Error creating call log:', error);
        throw error;
    }
};

// Helper function to update call by Twilio CallSid
export const updateCallLogByCallSid = async (
    callSid: string,
    updates: {
        status?: CallStatus;
        duration?: number;
        result?: DetectionResult;
        confidence?: number;
    }
): Promise<CallLog | null> => {
    try {
        const updated = await prisma.call.updateMany({
            where: { callSid },
            data: {
                ...(updates.status && { status: mapAppStatusToPrismaStatus(updates.status) }),
                ...(updates.duration !== undefined && { duration: updates.duration }),
                ...(updates.result && { detectionResult: mapAppResultToPrismaResult(updates.result) }),
                ...(updates.confidence !== undefined && { confidence: updates.confidence }),
            },
        });

        if (updated.count === 0) {
            return null;
        }

        const call = await prisma.call.findUnique({
            where: { callSid },
        });

        if (!call) return null;

        return transformCallToCallLog(call);
    } catch (error) {
        console.error('Error updating call log:', error);
        return null;
    }
};
