import React, { useState, useEffect, useCallback } from 'react';
import { PhoneIcon, CogIcon, UserCircleIcon, VoicemailIcon, ClockIcon } from './Icons';

type CallState = 'idle' | 'dialing' | 'ringing' | 'analyzing' | 'connected' | 'machine_detected' | 'human_detected' | 'error' | 'ended' | 'busy' | 'no_answer';

interface DialerProps {
  onCallEnded?: () => void;
}

interface CallResponse {
  success: boolean;
  callId: string;
  callSid: string;
  status: string;
  targetNumber: string;
  amdStrategy: string;
  error?: string;
}

const Dialer: React.FC<DialerProps> = ({ onCallEnded }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('twilio-native');
  const [callState, setCallState] = useState<CallState>('idle');
  const [demoMode, setDemoMode] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleEndCall = useCallback(async () => {
    if (currentCallId) {
      try {
        // Optionally hang up the call via API
        await fetch(`/api/calls/${currentCallId}/hangup`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Error hanging up call:', error);
      }
    }

    setCallState('ended');
    setCurrentCallId(null);
    setCurrentCallSid(null);
    setCallDuration(0);
    
    setTimeout(() => {
      setCallState('idle');
    }, 1000);

    if (onCallEnded) {
      onCallEnded();
    }
  }, [currentCallId, onCallEnded]);

  const handleDial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || isCalling) return;

    setCallState('dialing');
    setCallDuration(0);
    setError(null);

    try {
      // For demo purposes, using a mock user ID
      // In a real app, this would come from authentication
      const userId = 'demo-user-123';

      const endpoint = demoMode ? '/api/calls/demo-initiate' : '/api/calls/initiate';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetNumber: phoneNumber,
          amdStrategy: selectedStrategy,
          userId: userId,
        }),
      });

      const data: CallResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate call');
      }

      setCurrentCallId(data.callId);
      setCurrentCallSid(data.callSid);
      setCallState('ringing');

      // Start polling for call status updates
      pollCallStatus(data.callId);

    } catch (error) {
      console.error('Error initiating call:', error);
      setError(error instanceof Error ? error.message : 'Failed to initiate call');
      setCallState('error');
      
      setTimeout(() => {
        setCallState('idle');
        setError(null);
      }, 3000);
    }
  };

  // Poll for call status updates
  const pollCallStatus = useCallback(async (callId: string) => {
    const maxPolls = 60; // Poll for up to 60 seconds
    let pollCount = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/calls/${callId}/status`);
        const data = await response.json();

        if (response.ok && data.call) {
          const { status, detectionResult } = data.call;

          switch (status) {
            case 'RINGING':
              setCallState('ringing');
              break;
            case 'ANSWERED':
              setCallState('analyzing');
              break;
            case 'ANALYZING':
              setCallState('analyzing');
              break;
            case 'COMPLETED':
              if (detectionResult === 'HUMAN') {
                setCallState('human_detected');
                setTimeout(() => setCallState('connected'), 1000);
              } else if (detectionResult === 'MACHINE') {
                setCallState('machine_detected');
                setTimeout(() => handleEndCall(), 2000);
              } else {
                setCallState('ended');
              }
              return; // Stop polling
            case 'FAILED':
              setCallState('error');
              setTimeout(() => setCallState('idle'), 3000);
              return; // Stop polling
            case 'BUSY':
              setCallState('busy');
              setTimeout(() => setCallState('idle'), 3000);
              return; // Stop polling
            case 'NO_ANSWER':
              setCallState('no_answer');
              setTimeout(() => setCallState('idle'), 3000);
              return; // Stop polling
          }
        }

        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          // Timeout
          setCallState('error');
          setTimeout(() => setCallState('idle'), 3000);
        }
      } catch (error) {
        console.error('Error polling call status:', error);
        setCallState('error');
        setTimeout(() => setCallState('idle'), 3000);
      }
    };

    poll();
  }, [handleEndCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const StatusDisplay = () => {
    let icon: React.ReactNode, text: string, color: string;
    
    switch (callState) {
        case 'dialing':
            text = 'Dialing...';
            color = 'text-yellow-400';
            icon = <svg className="animate-spin h-6 w-6 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>;
            break;
        case 'ringing':
            text = 'Ringing...';
            color = 'text-blue-400';
            icon = <PhoneIcon className="animate-pulse h-6 w-6 mr-3" />;
            break;
        case 'analyzing':
            text = 'Analyzing Audio...';
            color = 'text-purple-400';
            icon = <CogIcon className="animate-spin h-6 w-6 mr-3" />;
            break;
        case 'human_detected':
             text = 'Human Detected';
             color = 'text-green-400';
             icon = <UserCircleIcon className="h-6 w-6 mr-3" />;
             break;
        case 'connected':
            text = `Connected: ${formatDuration(callDuration)}`;
            color = 'text-green-400';
            icon = <ClockIcon className="h-6 w-6 mr-3" />;
            break;
        case 'machine_detected':
            text = 'Voicemail Detected - Hanging Up';
            color = 'text-red-400';
            icon = <VoicemailIcon className="h-6 w-6 mr-3" />;
            break;
        case 'busy':
            text = 'Line Busy';
            color = 'text-red-500';
            icon = <PhoneIcon className="h-6 w-6 mr-3" />;
            break;
        case 'no_answer':
            text = 'No Answer';
            color = 'text-red-500';
            icon = <PhoneIcon className="h-6 w-6 mr-3" />;
            break;
        case 'error':
             text = error || 'Call Failed';
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
                onChange={(e) => setSelectedStrategy(e.target.value)}
                disabled={isCalling}
                className="w-full appearance-none pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="twilio-native">Twilio Native AMD</option>
                <option value="jambonz-sip">Jambonz SIP-Enhanced</option>
                <option value="huggingface-ml">Hugging Face ML Model</option>
                <option value="gemini-flash">Gemini Flash Real-Time</option>
              </select>
            </div>
          </div>
          <div className="flex items-center">
            <input
              id="demo-mode"
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              disabled={isCalling}
              className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-600 rounded bg-gray-700"
            />
            <label htmlFor="demo-mode" className="ml-2 block text-sm text-gray-400">
              Demo Mode (simulated calls)
            </label>
          </div>
        </div>
        <div className="mt-6">
            {isCalling ? (
                 <button
                    type="button"
                    onClick={handleEndCall}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center"
                 >
                    <PhoneIcon className="h-5 w-5 mr-2" /> End Call
                </button>
            ) : (
                <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center disabled:bg-green-800 disabled:cursor-not-allowed"
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