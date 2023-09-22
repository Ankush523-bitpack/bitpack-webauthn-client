import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.walletAddress) {
      setWalletAddress(router.query.walletAddress as string);
    }
    if (router.query.username) {
      setUsername(router.query.username as string);
    }
  }, [router.query]);

  const signOut = () => {
    // Clearing local storage and states
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('walletAddress');
    setWalletAddress(null);
    setUsername(null);
    
    // Redirecting back to the main page
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <div className="p-8 bg-white rounded-xl shadow-md w-[500px] space-y-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div>
          <label className="block text-sm font-medium text-gray-600">Username:</label>
          <p className="mt-1 text-gray-900">{username}</p>
        </div>
        {walletAddress && (
          <div>
            <label className="block text-sm font-medium text-gray-600">Wallet Address:</label>
            <p className="mt-1 text-gray-900">{walletAddress}</p>
          </div>
        )}
        <div className="flex justify-end">
          <button 
            onClick={signOut}
            className="p-2 text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
