import { AmdStrategy } from './types';

export const AMD_STRATEGIES = [
  { value: AmdStrategy.TWILIO_NATIVE, label: 'Twilio Native AMD' },
  { value: AmdStrategy.JAMBONZ, label: 'Jambonz (SIP-Enhanced)' },
  { value: AmdStrategy.HUGGING_FACE, label: 'Hugging Face Model' },
  { value: AmdStrategy.GEMINI_FLASH, label: 'Gemini 2.5 Flash Live' },
];
