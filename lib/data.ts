import { AmdStrategy, CallStatus, DetectionResult, type CallLog } from '@/types';

const mockPhoneNumbers = [
  '1-800-774-2678', // Costco
  '1-800-806-6453', // Nike
  '1-888-221-1161', // PayPal
  '1-800-275-2273', // Apple
  '1-800-444-3353', // Dell
];

const randomEnum = <T,>(anEnum: T): T[keyof T] => {
  const enumValues = Object.keys(anEnum)
    .map(n => (anEnum as any)[n])
    .filter(v => typeof v === 'string') as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
};

const INITIAL_MOCK_CALL_LOGS: CallLog[] = Array.from({ length: 50 }, (_, i) => {
    const status = randomEnum(CallStatus);
    let result: DetectionResult;
    if (status === CallStatus.COMPLETED) {
        result = Math.random() > 0.3 ? DetectionResult.MACHINE : DetectionResult.HUMAN;
    } else {
        result = DetectionResult.UNKNOWN;
    }

    return {
        id: `call_${i + 1}`,
        phoneNumber: mockPhoneNumbers[i % mockPhoneNumbers.length],
        strategy: randomEnum(AmdStrategy),
        status,
        duration: status === CallStatus.COMPLETED ? Math.floor(Math.random() * 300) + 5 : 0,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        result,
    };
});

let callLogs: CallLog[] = [...INITIAL_MOCK_CALL_LOGS];
const users = [
    { id: 'user_1', name: 'Demo User', email: 'user@example.com', password: 'password123' }
];

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

export const fetchCallLogs = async (): Promise<CallLog[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...callLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const createCallLog = async (logData: Omit<CallLog, 'id' | 'timestamp'>): Promise<CallLog> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    const newLog: CallLog = {
      ...logData,
      id: `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    callLogs.unshift(newLog);
    return newLog;
};
