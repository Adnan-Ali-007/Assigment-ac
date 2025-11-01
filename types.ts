export enum AmdStrategy {
  TWILIO_NATIVE = 'TWILIO_NATIVE',
  JAMBONZ = 'JAMBONZ',
  HUGGING_FACE = 'HUGGING_FACE',
  GEMINI_FLASH = 'GEMINI_FLASH',
}

export enum CallStatus {
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  BUSY = 'BUSY',
  NO_ANSWER = 'NO_ANSWER',
}

export enum DetectionResult {
  HUMAN = 'HUMAN',
  MACHINE = 'MACHINE',
  UNKNOWN = 'UNKNOWN',
  SILENCE = 'SILENCE',
  FAX = 'FAX',
}

export interface CallLog {
  id: string;
  phoneNumber: string;
  strategy: AmdStrategy;
  status: CallStatus;
  duration: number; // in seconds
  timestamp: string;
  result: DetectionResult;
}
