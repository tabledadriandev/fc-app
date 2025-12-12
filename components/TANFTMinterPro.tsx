"use client";

import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

export default function TANFTMinterPro() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkDNA = async () => {
    setLoading(true);
    setError("");
    
    try {
      let apiUrl = '/api/fetch-farcaster-user?';
      
      // Use wallet address if connected, otherwise require username input
      if (isConnected && address) {
        apiUrl += `wallet=${address}`;
      } else {
        setError('Please connect wallet or enter a username');
        setLoading(false);
        return;
      }
      
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      if (res.ok) {
        setUserData(data);
      } else {
        setError(data.error || 'User not found - try entering a username below');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const checkDNAWithUsername = async (username: string) => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const apiUrl = `/api/fetch-farcaster-user?username=${encodeURIComponent(username.trim())}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      if (res.ok) {
        setUserData(data);
      } else {
        setError(data.error || 'User not found');
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="border-4 border-black p-6 mb-8">
          <h1 className="text-5xl font-black mb-2">TABLE D'ADRIAN</h1>
          <p className="text-lg">Exclusive Dining NFT Collection</p>
        </div>

        {/* Main Card */}
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          
          {/* Wallet Status */}
          <div className="mb-6">
            {!isConnected ? (
              <button
                onClick={() => connect({ connector: injected() })}
                className="w-full bg-black text-white border-2 border-black p-4 text-lg font-black
                         hover:bg-white hover:text-black transition-all duration-200
                         active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         mb-4"
              >
                CONNECT WALLET
              </button>
            ) : (
              <div className="border-2 border-black p-4 bg-green-100 mb-4">
                <div className="flex justify-between items-center">
                  <div className="font-bold">WALLET CONNECTED</div>
                  <div className="font-mono text-sm">
                    {address?.substring(0, 6)}...
                  </div>
                </div>
              </div>
            )}
            
            {/* Username Input (Primary Method) */}
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Enter Your Farcaster Username:</label>
              <input
                type="text"
                placeholder="Enter your Farcaster username (without @)"
                className="w-full border-2 border-black p-3 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    checkDNAWithUsername((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Enter your Farcaster username"]') as HTMLInputElement;
                  if (input?.value) {
                    checkDNAWithUsername(input.value);
                  } else {
                    setError('Please enter a username');
                  }
                }}
                className="w-full mt-2 bg-black text-white border-2 border-black p-3 text-sm font-bold hover:bg-white hover:text-black transition-all"
              >
                Check DNA with Username
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border-2 border-black p-4">
              <div className="text-sm font-bold mb-1">PRICE</div>
              <div className="text-2xl font-black">0.003 ETH</div>
            </div>
            <div className="border-2 border-black p-4">
              <div className="text-sm font-bold mb-1">SUPPLY</div>
              <div className="text-2xl font-black">1,000</div>
            </div>
            <div className="border-2 border-black p-4">
              <div className="text-sm font-bold mb-1">CHAIN</div>
              <div className="text-2xl font-black">BASE</div>
            </div>
          </div>

          {/* Description */}
          <div className="border-2 border-black p-4 mb-8 bg-gray-50">
            <p className="text-sm">
              Mint a $tabledadrian NFT, all the fees goes in the LP of the token.
            </p>
          </div>

          {/* User Profile Display */}
          {userData && (
            <div className="border-2 border-black p-4 mb-8 bg-yellow-100">
              <div className="flex items-center gap-4">
                {userData.pfp_url && (
                  <img 
                    src={userData.pfp_url} 
                    alt="Profile" 
                    className="w-16 h-16 border-2 border-black"
                  />
                )}
                <div>
                  <div className="font-bold text-lg">@{userData.username}</div>
                  <div className="text-sm">FID: {userData.fid}</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="border-2 border-red-600 bg-red-50 p-4 mb-8">
              <div className="font-bold text-red-600">{error}</div>
            </div>
          )}

          {/* Check DNA Button */}
          <button
            onClick={checkDNA}
            disabled={loading}
            className="w-full bg-black text-white border-4 border-black p-6 text-xl font-black
                     hover:bg-white hover:text-black transition-all duration-200
                     active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                     disabled:opacity-50"
          >
            {loading ? 'CHECKING...' : isConnected ? 'CHECK YOUR DNA WITH WALLET' : 'CHECK YOUR DNA'}
          </button>

          {/* Contract Link */}
          <div className="mt-6 text-center">
            <a href="#" className="text-sm underline hover:no-underline font-bold">
              VIEW CONTRACT →
            </a>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 border-4 border-black p-4 bg-black text-white">
          <div className="text-center">
            <div className="font-bold">TABLE D'ADRIAN NFT</div>
            <div className="text-sm mt-1">Powered by Base Network</div>
          </div>
        </div>

      </div>
    </div>
  );
}