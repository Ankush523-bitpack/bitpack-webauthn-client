import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { client } from '@passwordless-id/webauthn';

export default function Home() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // New state for logged-in status

  useEffect(() => {
    // On initial render, check localStorage for logged-in status and wallet address
    const savedLoggedInStatus = localStorage.getItem('isLoggedIn');
    const savedWalletAddress = localStorage.getItem('walletAddress');
    
    if (savedLoggedInStatus) {
      setIsLoggedIn(true);
    }
    if (savedWalletAddress) {
      setWalletAddress(savedWalletAddress);
    }
  }, []);

  const register = async () => {
    try {
      const challengeResponse = await axios.post('http://localhost:3000/request-challenge', { username });
      const challenge = challengeResponse.data.challenge;

      const registration = await client.register(username, challenge, {
        authenticatorType: "auto",
        userVerification: "required",
        timeout: 60000,
        attestation: false,
        debug: false,
      });

    console.log(registration);

      await axios.post('http://localhost:3000/register', registration);

      setMessage('Registration successful!');
    } catch (error:any) {
      setMessage('Registration failed: ' + error.message);
    }
  };

  const getWalletAddress = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/credentials/${username}`);
      if (response.data && response.data.walletAddress) {
        setWalletAddress(response.data.walletAddress);
        localStorage.setItem('walletAddress', response.data.walletAddress);  // Save to localStorage
      } else {
        throw new Error("Wallet address not found");
      }
    } catch (error:any) {
      setMessage('Failed to retrieve wallet address: ' + error.message);
    }
  };

  const authenticate = async () => {
    try {
        const challengeResponse = await axios.post('http://localhost:3000/request-challenge', { username });
        const challenge = challengeResponse.data.challenge;
        console.log("challenge for verification : ",challenge);
        // Fetch the credential IDs for the user
        const credentialsResponse = await axios.get(`http://localhost:3000/credentials/${username}`);
        const credentials = credentialsResponse.data.credentialIds;

        const authentication = await client.authenticate(
            credentials,
            challenge,
            {
                authenticatorType: "auto",
                userVerification: "required",
                timeout: 60000,
            }
        );

        await axios.post('http://localhost:3000/authenticate', { challenge, authentication });

        setMessage('Authentication successful!');
        setIsLoggedIn(true);  // Set logged-in status to true
        localStorage.setItem('isLoggedIn', 'true');  // Save to localStorage
        await getWalletAddress();
    } catch (error:any) {
        setMessage('Authentication failed: ' + error.message);
    }
  };

  const signOut = () => {
    setIsLoggedIn(false);
    setWalletAddress('');
    setUsername('');
    setMessage('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('walletAddress');
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <div className="p-8 bg-white rounded-xl shadow-md w-[500px] space-y-4">
        { !isLoggedIn ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-600">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username"
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>
            <div className="flex justify-between space-x-4">
              <button 
                onClick={register}
                className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Register
              </button>
              <button 
                onClick={authenticate}
                className="w-full p-2 text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Login
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={signOut}
                className="p-2 text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Sign Out
              </button>
            </div>
            {walletAddress && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Wallet Address:</label>
                <p className="mt-1 text-gray-900">{walletAddress}</p>
              </div>
            )}
          </div>
        )}
        {message && <p className="text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
  
}