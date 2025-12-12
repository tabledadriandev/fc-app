"use client";

import { useState } from "react";

export default function TANFTMinterPro() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkDNA = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch('/api/fetch-farcaster-user?username=adriantable');
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
          
          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border-2 border-black p-4">
              <div className="text-sm font-bold mb-1">PRICE</div>
              <div className="text-2xl font-black">FREE</div>
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
              Mint your exclusive dining experience NFT. Each token grants access to 
              private chef services and wellness consultations.
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
            {loading ? 'CHECKING...' : 'CHECK YOUR DNA'}
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
          <div className="flex justify-between items-center">
            <div className="font-bold">421 MINTED</div>
            <div className="font-bold">579 REMAINING</div>
          </div>
        </div>

      </div>
    </div>
  );
}