import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { client } from "@passwordless-id/webauthn";
import Cookie from "js-cookie";
// import { authenticateUser, registerUser } from "uim-sdk-ts";

export default function Home() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const loggedInUsername = Cookie.get("username");
    const walletAddress = Cookie.get("walletAddress");
    if (loggedInUsername && walletAddress) {
      router.push(`/dashboard`);
    }
  }, [router]);

  const origin = "https://bitpack-webauthn-client.vercel.app";

  const register = async (origin:string) => {
   try {
      const challengeResponse = await axios.post('https://uim-alpha.meroku.org/request-challenge', { username });
      const challenge = challengeResponse.data.challenge;
      console.log(challenge)

      const registration = await client.register(username, challenge, {
        authenticatorType: "auto",
        userVerification: "required",
        timeout: 60000,
        attestation: false,
        debug: false,
      });

      const payload = {
        registration,
        origin
      }

      console.log(payload)

      await axios.post('https://uim-alpha.meroku.org/register', payload);
      setMessage('Registration successful!');
    } 
    catch (error: any) {
      setMessage('Registration failed: ' + error.message);
    }
    // try {
    //   const res = await registerUser(username,origin);
    //   setMessage("Registration successful!");
    //   console.log(res)
    // } 
    // catch (error: any) {
    //   setMessage(error.message);
    // }
  };

  const authenticate = async (origin:string) => {
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

      await axios.post('https://uim-alpha.meroku.org/authenticate', { challenge, authentication, origin });

      setMessage('Authentication successful!');
      
      const response = await axios.get(`https://uim-alpha.meroku.org/credentials/${username}`);
      if (response.data && response.data.walletAddress) {
          Cookie.set('username', username);
          Cookie.set('walletAddress', response.data.walletAddress);
          const redirectUrl = router.query.redirect || '/dashboard';
          router.push(`${redirectUrl.toString()}?username=${username}&walletAddress=${response.data.walletAddress}`);
      } else {
          throw new Error("Wallet address not found");
      }

    } 
    catch (error: any) {
      setMessage('Authentication failed: ' + error.message);
    }
    // try {
    //   const res = await authenticateUser(username,origin);
    //   console.log("result Auth : ", res)
    //   setMessage("Authentication successful!");
    //   Cookie.set("username", username);
    //   Cookie.set("walletAddress", res);
    //   router.push("/dashboard"); // Removed the query parameters here
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
              onClick={() => register(origin)}
              className="w-full p-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Register
            </button>
            <button
              onClick={() => authenticate(origin)}
              className="w-full p-2 text-white bg-green-500 rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Login
            </button>
          </div>
        </div>
        {message && <p className="text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}
