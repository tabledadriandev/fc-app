"use client";

import { useState, useEffect } from "react";

interface GalleryItem {
  id: string;
  username: string;
  wallet_address: string;
  nft_image_url: string;
  pfp_url: string | null;
  cast_text: string | null;
  cast_hash: string | null;
  cast_timestamp: string | null;
  tx_hash: string;
  minted_at: string;
}

export default function Gallery() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const res = await fetch("/api/gallery?limit=50");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch gallery");
      }

      setGallery(data.gallery || []);
    } catch (err) {
      console.error("Error fetching gallery:", err);
      setError(err instanceof Error ? err.message : "Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black mb-6">GALLERY</h2>
        <div className="text-center py-8">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black mb-6">GALLERY</h2>
        <div className="border-2 border-red-600 bg-red-50 p-4">
          <div className="font-bold text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-4 border-black p-4 sm:p-6 md:p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6">GALLERY</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">All minted NFTs with their shared casts</p>

      {gallery.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-sm text-gray-600">No NFTs minted yet. Be the first!</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="border-2 border-black bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              {/* NFT Image */}
              <div className="aspect-square border-b-2 border-black overflow-hidden bg-gray-100">
                <img
                  src={item.nft_image_url}
                  alt={`TA NFT ${item.username}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4">
                {/* User Info */}
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  {item.pfp_url ? (
                    <img
                      src={item.pfp_url}
                      alt={item.username}
                      className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-black rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-black bg-gray-200 rounded-full flex-shrink-0"></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm sm:text-base truncate">@{item.username}</div>
                    <div className="text-xs text-gray-600">{formatDate(item.minted_at)}</div>
                  </div>
                </div>

                {/* Cast Text */}
                {item.cast_text && (
                  <div className="border-2 border-black p-2 sm:p-3 mb-2 sm:mb-3 bg-yellow-50">
                    <div className="text-xs font-bold mb-1">SHARED CAST:</div>
                    <div className="text-xs sm:text-sm break-words">{item.cast_text}</div>
                    {item.cast_hash && (
                      <a
                        href={`https://warpcast.com/~/conversations/${item.cast_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block break-all"
                      >
                        View on Warpcast →
                      </a>
                    )}
                  </div>
                )}

                {/* Transaction */}
                <div className="text-xs">
                  <a
                    href={`https://basescan.org/tx/${item.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-mono break-all"
                  >
                    View on BaseScan →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

