import React from 'react';
import { PhoneWaveIcon, LogoutIcon } from './Icons';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <PhoneWaveIcon className="h-8 w-8 text-brand-blue" />
            <h1 className="text-xl font-bold ml-3 text-gray-100">
              Attack Capital <span className="font-light text-gray-300">| Advanced AMD</span>
            </h1>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue transition-colors"
          >
            <LogoutIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;