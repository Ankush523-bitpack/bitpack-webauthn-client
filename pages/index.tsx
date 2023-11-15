import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { client } from "@passwordless-id/webauthn";
import { config } from "dotenv";
// import { authenticateUser, registerUser } from "uim-sdk-ts";

config();

const meroku_url = 'https://uim-alpha.meroku.org';

export default function Home() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState(""); 
  const router = useRouter();

  useEffect(() => {
    // set origin from window.location.origin when the component mounts
    if (typeof window !== "undefined") { // checks if window is defined
      setOrigin(window.location.origin);
    }
  }, []);

  const handleUserIntent = async () => {
    try {
      const { data } = await axios.post(`${meroku_url}/user-exists`, { username });
        
      if (data.exists) {
        await login();
      } else {
        await register();
      }
    } catch (error: any) {
      setMessage("An error occurred: " + error.message);
    }
  };

  const handleRedirect = async () => {
    const response = await axios.get(`${meroku_url}/credentials/${username}`);
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
      const challengeResponse = await axios.post(`${meroku_url}/request-challenge`, { username });
      const challenge2 = challengeResponse.data.challenge;
      const registration = await client.register(username, challenge2, {
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
      await axios.post(`${meroku_url}/userIntention`, { userIntent: "register", payload });
      setMessage('Registration successful!');
      await handleRedirect();
    } catch (error: any) {
      if (error.message === "Operation failed." || error.message === "The operation either timed out or was not allowed. See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client")
      {
        setMessage('Registration failed due to absence of a passkey on your device. Set up a passkey on your device and try again');
          // Check for device type and redirect accordingly
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // iOS device
        window.location.href = "https://passkeys-demo.appspot.com"; // URL for iOS passkey setup
      } else if (/android/i.test(navigator.userAgent)) {
        // Android device
        window.location.href = "https://support.google.com/accounts/answer/6103523?hl=en"; // URL for Android passkey setup
      } else {
        // For other devices or unable to determine the device type
        setMessage('Set up a passkey on your device and try again.');
      }
      }
      else
      {
        setMessage('Registration failed: ' + error.message);
      }
    }

    // try {
    //   const res = await registerUser(username,origin);
    //   setMessage("Registration successful!");
    //   await handleRedirect();
    //   console.log(res)
    // } 
    // catch (error: any) {
    //   setMessage(error.message);
    // }
  };

  const login = async () => {
    try {
      const challengeResponse = await axios.post(`${meroku_url}/request-challenge`, { username });
      const challenge = challengeResponse.data.challenge;
      const credentialsResponse = await axios.get(`${meroku_url}/credentials/${username}`);
      const credentials = credentialsResponse.data.credentialIds;
      const authentication = await client.authenticate(credentials, challenge, {
        authenticatorType: "auto",
        userVerification: "required",
        timeout: 60000,
      });
      await axios.post(`${meroku_url}/userIntention`, { userIntent: "login", challenge, authentication, origin });
      setMessage('Authentication successful!');
      await handleRedirect();
    } catch (error: any) {
      if(error.message === "The operation either timed out or was not allowed. See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client."){
        setMessage('This username is not available. Please try something else.');
      }
      else{
        setMessage('Authentication failed: ' + error.message);
      }
    }

    // try {
    //   const res = await authenticateUser(username,origin);
    //   console.log("result Auth : ", res)
    //   setMessage("Authentication successful!");
    //   await handleRedirect();
    // } catch (error: any) {
    //   setMessage("Authentication failed: " + error.message);
    // }
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
