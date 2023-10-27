import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { client } from "@passwordless-id/webauthn";

export default function Home() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const origin = "https://bitpack-webauthn-client.vercel.app";

  const handleUserIntent = async () => {
    try {
      const { data } = await axios.post('https://uim-alpha.meroku.org/user-exists', { username });
        
      if (data.exists) {
        if (window.confirm("User already exists. Do you want to log in instead?")) {
          await login();
        }
      } else {
        await register();
      }
    } catch (error: any) {
      setMessage("An error occurred: " + error.message);
    }
  };

  const handleRedirect = async () => {
    const response = await axios.get(`https://uim-alpha.meroku.org/credentials/${username}`);
    if (response.data && response.data.walletAddress) {
      localStorage.setItem('username', username);
      localStorage.setItem('walletAddress', response.data.walletAddress);
      const redirectUrl = '/dashboard';
      router.push(redirectUrl);
    } else {
      throw new Error("Wallet address not found");
    }
  };


  const register = async () => {
    try {
      const challengeResponse = await axios.post('https://uim-alpha.meroku.org/request-challenge', { username });
      const challenge = challengeResponse.data.challenge;
      const registration = await client.register(username, challenge, {
        authenticatorType: "auto",
        userVerification: "required",
        timeout: 60000,
        attestation: false,
        debug: false,
      });
      const payload = {
        registration,
        origin,
      };
      await axios.post('https://uim-alpha.meroku.org/userIntention', { userIntent: "register", payload });
      setMessage('Registration successful!');
      await handleRedirect();
    } catch (error: any) {
      setMessage('Registration failed: ' + error.message);
    }
  };

  const login = async () => {
    try {
      const challengeResponse = await axios.post('https://uim-alpha.meroku.org/request-challenge', { username });
      const challenge = challengeResponse.data.challenge;
      const credentialsResponse = await axios.get(`https://uim-alpha.meroku.org/credentials/${username}`);
      const credentials = credentialsResponse.data.credentialIds;
      const authentication = await client.authenticate(credentials, challenge, {
        authenticatorType: "auto",
        userVerification: "required",
        timeout: 60000,
      });
      await axios.post('https://uim-alpha.meroku.org/userIntention', { userIntent: "login", challenge, authentication, origin });
      setMessage('Authentication successful!');
      await handleRedirect();
    } catch (error: any) {
      setMessage('Authentication failed: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-black">
      <div className="p-8 bg-white rounded-xl shadow-md w-[500px] space-y-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-600"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="mt-1 p-2 w-full border rounded-md"
            />
          </div>
          <div className="flex justify-between space-x-4">
            <button
              onClick={() => handleUserIntent()}
              className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Sign In
            </button>
          </div>
        </div>
        {message && <p className="text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}
