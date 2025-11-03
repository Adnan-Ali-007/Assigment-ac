'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Dialer from '@/components/Dialer';
import CallHistory from '@/components/CallHistory';
import StrategyComparison from '@/components/StrategyComparison';
import { CallLog } from '@/types';

export default function DashboardPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // For demo, always authenticated
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

  const handleLogout = () => {
    console.log('Logout clicked - redirecting immediately');
    // Clear any local state
    setCallLogs([]);
    // Immediate redirect to login page
    window.location.href = '/login';
  };

  const handleCallEnded = () => {
    fetchLogs();
  };

  return (
    <div className="min-h-screen">
      <Header onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1">
            <Dialer onCallEnded={handleCallEnded} />
          </div>
          <div className="xl:col-span-2">
            <CallHistory initialLogs={callLogs} />
          </div>
          <div className="xl:col-span-1">
            <StrategyComparison />
          </div>
        </div>
      </main>
    </div>
  );
}
