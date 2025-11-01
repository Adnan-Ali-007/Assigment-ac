import React, { useState, useEffect, useCallback } from 'react';
import { AmdStrategy, CallStatus, DetectionResult, CallLog } from '../types';
import { AMD_STRATEGIES } from '../constants';
import { PhoneIcon, CogIcon, UserCircleIcon, VoicemailIcon, ClockIcon } from './Icons';

type CallState = 'idle' | 'dialing' | 'ringing' | 'connected' | 'machine_detected' | 'human_detected' | 'error' | 'ended' | 'busy' | 'no_answer';

interface DialerProps {
  onCallEnded: () => void;
}

const Dialer: React.FC<DialerProps> = ({ onCallEnded }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<AmdStrategy>(AmdStrategy.GEMINI_FLASH);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [currentCallStateForLog, setCurrentCallStateForLog] = useState<CallState>('idle');

  const isCalling = callState !== 'idle' && callState !== 'ended' && callState !== 'error';

  useEffect(() => {
    let timer: number;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  const handleEndCall = useCallback(async (finalStatusString: string = 'completed') => {
    const statusMap: { [key: string]: CallStatus } = {
        'completed': CallStatus.COMPLETED,
        'busy': CallStatus.BUSY,
        'no_answer': CallStatus.NO_ANSWER,
        'failed': CallStatus.FAILED,
    };

    const determineResult = (): DetectionResult => {
        if (currentCallStateForLog === 'human_detected' || currentCallStateForLog === 'connected') return DetectionResult.HUMAN;
        if (currentCallStateForLog === 'machine_detected') return DetectionResult.MACHINE;
        return DetectionResult.UNKNOWN;
    };

    const newLogData: Omit<CallLog, 'id' | 'timestamp'> = {
        phoneNumber,
        strategy: selectedStrategy,
        status: statusMap[finalStatusString] || CallStatus.FAILED,
        duration: callDuration,
        result: determineResult(),
    };

    try {
        const response = await fetch('/api/calls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newLogData),
        });
        if (!response.ok) {
            throw new Error('Failed to save call log');
        }
        onCallEnded();
    } catch (error) {
        console.error("Failed to save call log:", error);
    }

    setCallState('ended');
    setTimeout(() => {
        setCallState('idle');
    }, 1000);
  }, [phoneNumber, selectedStrategy, callDuration, currentCallStateForLog, onCallEnded]);

  const handleDial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || isCalling) return;

    setCallState('dialing');
    setCurrentCallStateForLog('dialing');
    setCallDuration(0);

    setTimeout(() => { setCallState('ringing'); setCurrentCallStateForLog('ringing'); }, 1500);

    setTimeout(() => {
      const outcome = Math.random();
      if (outcome < 0.6) {
        setCallState('human_detected'); setCurrentCallStateForLog('human_detected');
        setTimeout(() => { setCallState('connected'); setCurrentCallStateForLog('connected'); }, 1000);
      } else if (outcome < 0.9) {
        setCallState('machine_detected'); setCurrentCallStateForLog('machine_detected');
        setTimeout(() => handleEndCall('completed'), 2000);
      } else if (outcome < 0.95) {
        setCallState('busy'); setCurrentCallStateForLog('busy');
         setTimeout(() => handleEndCall('busy'), 2000);
      } else {
        setCallState('no_answer'); setCurrentCallStateForLog('no_answer');
        setTimeout(() => handleEndCall('no_answer'), 2000);
      }
    }, 4000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const StatusDisplay = () => {
    let icon, text, color;
    switch (callState) {
        case 'dialing':
            text = 'Dialing...';
            color = 'text-brand-yellow';
            icon = <svg className="animate-spin h-6 w-6 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>;
            break;
        case 'ringing':
            text = 'Ringing...';
            color = 'text-brand-blue';
            icon = <PhoneIcon className="animate-pulse h-6 w-6 mr-3" />;
            break;
        case 'human_detected':
             text = 'Human Detected';
             color = 'text-brand-green';
             icon = <UserCircleIcon className="h-6 w-6 mr-3" />;
             break;
        case 'connected':
            text = `Connected: ${formatDuration(callDuration)}`;
            color = 'text-brand-green';
            icon = <ClockIcon className="h-6 w-6 mr-3" />;
            break;
        case 'machine_detected':
            text = 'Voicemail Detected';
            color = 'text-brand-red';
            icon = <VoicemailIcon className="h-6 w-6 mr-3" />;
            break;
        case 'busy':
        case 'no_answer':
        case 'error':
             text = callState === 'busy' ? 'Line Busy' : callState === 'no_answer' ? 'No Answer' : 'Call Failed';
             color = 'text-red-500';
             icon = <PhoneIcon className="h-6 w-6 mr-3" />;
             break;
        case 'ended':
             text = 'Call Ended';
             color = 'text-gray-400';
             icon = <PhoneIcon className="h-6 w-6 mr-3" />;
             break;
        default:
            return <p className="text-gray-400 text-center text-sm h-14 flex items-center justify-center">Enter a number to start a call.</p>;
    }
    return (
        <div className={`h-14 flex items-center justify-center font-medium ${color}`}>
            {icon}
            <span>{text}</span>
        </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
      <h2 className="text-lg font-bold text-gray-100 mb-4">Dialer</h2>
      <form onSubmit={handleDial}>
        <div className="space-y-4">
          <div>
            <label htmlFor="phone-number" className="block text-sm font-medium text-gray-400 mb-1">
              Target Number
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="phone-number"
                type="tel"
                placeholder="e.g., 1-800-555-1234"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={isCalling}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label htmlFor="amd-strategy" className="block text-sm font-medium text-gray-400 mb-1">
              AMD Strategy
            </label>
            <div className="relative">
               <CogIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
               <select
                id="amd-strategy"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as AmdStrategy)}
                disabled={isCalling}
                className="w-full appearance-none pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
              >
                {AMD_STRATEGIES.map((strategy) => (
                  <option key={strategy.value} value={strategy.value}>{strategy.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6">
            {isCalling ? (
                 <button
                    type="button"
                    onClick={() => handleEndCall('completed')}
                    className="w-full bg-brand-red hover:bg-red-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center"
                 >
                    <PhoneIcon className="h-5 w-5 mr-2" /> End Call
                </button>
            ) : (
                <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center disabled:bg-green-800 disabled:cursor-not-allowed"
                    disabled={!phoneNumber}
                >
                    <PhoneIcon className="h-5 w-5 mr-2" /> Dial Now
                </button>
            )}
        </div>
      </form>
      <div className="mt-6 border-t border-gray-700 pt-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-2 text-center">Live Status</h3>
        <div className="bg-gray-900 rounded-lg p-2">
            <StatusDisplay/>
        </div>
      </div>
    </div>
  );
};

export default Dialer;