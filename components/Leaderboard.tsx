"use client";

import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  wallet_address: string;
  pfp_url: string | null;
  mint_count: number;
  total_eth: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch leaderboard");
      }

      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black mb-6">LEADERBOARD</h2>
        <div className="text-center py-8">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black mb-6">LEADERBOARD</h2>
        <div className="border-2 border-red-600 bg-red-50 p-4">
          <div className="font-bold text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-black p-4 sm:p-6 md:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6">LEADERBOARD</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Top minters by total NFTs minted</p>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-sm text-gray-600">No mints yet. Be the first!</div>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {leaderboard.map((entry) => (
            <div
              key={entry.wallet_address}
              className="border-2 border-black p-3 sm:p-4 bg-yellow-50 hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Rank */}
                <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 border-2 border-black bg-black text-white flex items-center justify-center font-black text-base sm:text-xl">
                  #{entry.rank}
                </div>

                {/* PFP */}
                {entry.pfp_url ? (
                  <img
                    src={entry.pfp_url}
                    alt={entry.username}
                    className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-black rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-black bg-gray-200 rounded-full flex-shrink-0"></div>
                )}

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm sm:text-base md:text-lg truncate">@{entry.username}</div>
                  <div className="text-xs font-mono text-gray-600 truncate">
                    {entry.wallet_address.substring(0, 6)}...{entry.wallet_address.substring(entry.wallet_address.length - 4)}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-lg sm:text-xl">{entry.mint_count}</div>
                  <div className="text-xs text-gray-600">NFTs</div>
                  <div className="text-xs sm:text-sm font-bold mt-1">{entry.total_eth.toFixed(3)} ETH</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

