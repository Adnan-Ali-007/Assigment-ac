'use client';

import React, { useState, useMemo } from 'react';
import { AmdStrategy, CallStatus, CallLog, DetectionResult } from '../types';
import { AMD_STRATEGIES } from '../constants';
import { HistoryIcon, FilterIcon, DownloadIcon } from './Icons';

const ITEMS_PER_PAGE = 10;

interface CallHistoryProps {
  initialLogs: CallLog[];
}

const CallHistory: React.FC<CallHistoryProps> = ({ initialLogs }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [strategyFilter, setStrategyFilter] = useState<AmdStrategy | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CallStatus | 'all'>('all');

  const filteredLogs = useMemo(() => {
    return initialLogs
      .filter(log => strategyFilter === 'all' || log.strategy === strategyFilter)
      .filter(log => statusFilter === 'all' || log.status === statusFilter);
  }, [initialLogs, strategyFilter, statusFilter]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const getStatusChip = (status: CallStatus) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full capitalize";
    switch (status) {
      case CallStatus.COMPLETED:
        return <span className={`${baseClasses} bg-green-500/20 text-green-400`}>Completed</span>;
      case CallStatus.FAILED:
        return <span className={`${baseClasses} bg-red-500/20 text-red-400`}>Failed</span>;
      case CallStatus.BUSY:
        return <span className={`${baseClasses} bg-yellow-500/20 text-yellow-400`}>Busy</span>;
      case CallStatus.NO_ANSWER:
        return <span className={`${baseClasses} bg-gray-500/20 text-gray-400`}>No Answer</span>;
      default:
        return <span className={`${baseClasses} bg-gray-600/30 text-gray-500`}>{status}</span>;
    }
  };

  const getResultChip = (result: DetectionResult) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full capitalize";
    switch (result) {
        case DetectionResult.HUMAN:
            return <span className={`${baseClasses} bg-blue-500/20 text-blue-400`}>Human</span>;
        case DetectionResult.MACHINE:
            return <span className={`${baseClasses} bg-purple-500/20 text-purple-400`}>Machine</span>;
        case DetectionResult.FAX:
            return <span className={`${baseClasses} bg-gray-500/20 text-gray-300`}>Fax</span>;
        case DetectionResult.SILENCE:
            return <span className={`${baseClasses} bg-gray-500/20 text-gray-400`}>Silence</span>;
        default:
            return <span className={`${baseClasses} bg-gray-600/30 text-gray-500`}>Unknown</span>;
    }
  };

  const getStrategyLabel = (strategy: AmdStrategy) => {
    return AMD_STRATEGIES.find(s => s.value === strategy)?.label || 'Unknown';
  };

  const handleExport = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Phone Number', 'Strategy', 'Status', 'Duration (s)', 'Timestamp', 'Result'];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${log.id}"`,
        `"${log.phoneNumber}"`,
        `"${getStrategyLabel(log.strategy)}"`,
        `"${log.status}"`,
        log.duration,
        `"${log.timestamp}"`,
        `"${log.result}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `call_history_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (paginatedLogs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">{initialLogs.length === 0 ? "No call history found." : "No call logs match your filters."}</p>
            </div>
        );
    }
    return (
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0 border-b border-gray-700">
          <tr>
            <th scope="col" className="px-4 py-3">Number</th>
            <th scope="col" className="px-4 py-3">Strategy</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Result</th>
            <th scope="col" className="px-4 py-3">Duration</th>
            <th scope="col" className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {paginatedLogs.map((log) => (
            <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
              <td className="px-4 py-4 font-mono text-gray-200">{log.phoneNumber}</td>
              <td className="px-4 py-4 whitespace-nowrap">{getStrategyLabel(log.strategy)}</td>
              <td className="px-4 py-4">{getStatusChip(log.status)}</td>
              <td className="px-4 py-4">{getResultChip(log.result)}</td>
              <td className="px-4 py-4">{log.duration}s</td>
              <td className="px-4 py-4 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-700">
        <div className="flex items-center mb-4 sm:mb-0">
          <HistoryIcon className="h-6 w-6 mr-3 text-gray-400" />
          <h2 className="text-lg font-bold text-gray-100">Call History</h2>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={strategyFilter}
              onChange={(e) => { setStrategyFilter(e.target.value as AmdStrategy | 'all'); setCurrentPage(1); }}
              className="w-full sm:w-auto appearance-none pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="all">All Strategies</option>
              {AMD_STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="relative">
            <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as CallStatus | 'all'); setCurrentPage(1); }}
              className="w-full sm:w-auto appearance-none pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="all">All Statuses</option>
              {Object.values(CallStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="flex-shrink-0 flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadIcon className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        {renderContent()}
      </div>
      
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex justify-between items-center pt-4 mt-4 border-t border-gray-700">
          <span className="text-sm text-gray-400">
            Showing <span className="font-medium text-gray-200">{paginatedLogs.length}</span> of <span className="font-medium text-gray-200">{filteredLogs.length}</span> results
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistory;