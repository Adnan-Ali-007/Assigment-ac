import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, UserPlusIcon } from './Icons';
import { Spinner } from './Spinner';
import { loginUser, signupUser } from '../api';

interface LoginProps {
  onLogin: () => void;
}

type View = 'login' | 'signup';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  }, [view]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await loginUser(email, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
        await signupUser(name, email, password);
        setSuccessMessage('Account created successfully! Please sign in.');
        setView('login');
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
        setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLoginSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          placeholder="user@example.com"
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          placeholder="••••••••"
        />
         <p className="text-xs text-gray-500 mt-2">Hint: Use password `password123` for the demo user.</p>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
            Sign In
          </>
        ) : "Sign In"}
      </button>
    </form>
  );

  const renderSignupForm = () => (
    <form onSubmit={handleSignupSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="name">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          placeholder="John Doe"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="signup-email">
          Email Address
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          placeholder="your@email.com"
        />
      </div>
       <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="signup-password">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          placeholder="••••••••"
        />
      </div>
       <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="confirm-password">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-green hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Spinner className="-ml-1 mr-3 h-5 w-5 text-white" />
            Create Account
          </>
        ) : "Create Account"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          {view === 'login' ? (
             <ShieldCheckIcon className="h-12 w-12 text-brand-blue mb-3" />
          ) : (
            <UserPlusIcon className="h-12 w-12 text-brand-green mb-3" />
          )}
          <h1 className="text-2xl font-bold text-gray-100">Attack Capital AMD</h1>
          <p className="text-gray-400">{view === 'login' ? 'Secure Sign In' : 'Create an Account'}</p>
        </div>
        
        {view === 'login' ? renderLoginForm() : renderSignupForm()}
        
        {error && (
            <p className="text-sm text-brand-red mt-4 text-center">{error}</p>
        )}
        {successMessage && (
            <p className="text-sm text-brand-green mt-4 text-center">{successMessage}</p>
        )}

        <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
                {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="font-medium text-brand-blue hover:underline">
                    {view === 'login' ? 'Sign Up' : 'Sign In'}
                </button>
            </p>
        </div>
         <p className="text-xs text-gray-500 mt-4 text-center">Using Better-Auth for enterprise-grade security.</p>
      </div>
    </div>
  );
};

export default Login;