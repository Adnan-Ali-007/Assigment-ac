
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Header from './components/Header';
import Dialer from './components/Dialer';
import CallHistory from './components/CallHistory';
import { fetchCallLogs } from './api';
import { CallLog } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshHistoryKey, setRefreshHistoryKey] = useState(0);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCallLogs()
        .then(setCallLogs)
        .catch(err => console.error("Failed to fetch call logs:", err));
    }
  }, [isAuthenticated, refreshHistoryKey]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleCallEnded = () => {
    setRefreshHistoryKey(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header onLogout={handleLogout} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Dialer onCallEnded={handleCallEnded} />
          </div>
          <div className="lg:col-span-2">
            <CallHistory key={refreshHistoryKey} initialLogs={callLogs} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
