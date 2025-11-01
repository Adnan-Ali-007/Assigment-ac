'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Dialer from '@/components/Dialer';
import CallHistory from '@/components/CallHistory';
import { CallLog } from '@/types';

export default function DashboardPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const router = useRouter();

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/calls');
      if (res.ok) {
        const data = await res.json();
        setCallLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch call logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleCallEnded = () => {
    fetchLogs();
  };

  return (
    <div className="min-h-screen">
      <Header onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Dialer onCallEnded={handleCallEnded} />
          </div>
          <div className="lg:col-span-2">
            <CallHistory initialLogs={callLogs} />
          </div>
        </div>
      </main>
    </div>
  );
}
