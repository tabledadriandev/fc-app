import TANFTMinterPro from "@/components/TANFTMinterPro";
import Leaderboard from "@/components/Leaderboard";
import Gallery from "@/components/Gallery";
import WalletProvider from "@/components/WalletProvider";
import FarcasterConfigProvider from "@/components/FarcasterConfigProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import NextTickShim from "@/components/NextTickShim";

export default function Home() {
  return (
    <ErrorBoundary>
      <NextTickShim />
      <FarcasterConfigProvider>
        <WalletProvider>
          <div className="min-h-screen bg-white">
            {/* Main Minter - Full Width */}
            <TANFTMinterPro />

            {/* Leaderboard and Gallery Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6 sm:pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                <Leaderboard />
                <Gallery />
              </div>
            </div>
          </div>
        </WalletProvider>
      </FarcasterConfigProvider>
    </ErrorBoundary>
  );
}
