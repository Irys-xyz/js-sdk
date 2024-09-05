"use client";
import { useState } from "react";
import { SiRetroarch } from "react-icons/si";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

const ConnectWallet = (): JSX.Element => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Not connected");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      //@ts-ignore
      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = createWalletClient({
        account,
        chain: sepolia,
        //@ts-ignore
        transport: custom(window.ethereum),
      });

      setWalletAddress(account);
      setStatusMessage(`Connected from ${account}`);
      setIsConnected(true);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setStatusMessage("Error connecting to wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setStatusMessage("Not connected");
    setWalletAddress(null);
  };

  return (
    <div className="border-2 border-primary rounded-2xl p-4 w-full max-w-md">
      <button
        className="bg-primary text-secondary px-6 py-3 rounded-2xl shadow-md hover:shadow-lg active:translate-y-1 active:shadow-none transition-all duration-150 ease-in-out flex items-center justify-center"
        onClick={isConnected ? disconnectWallet : connectWallet}
      >
        {isConnecting ? (
          <SiRetroarch className="animate-spin text-2xl" />
        ) : isConnected ? (
          "Disconnect Wallet"
        ) : (
          "Connect Wallet"
        )}
      </button>
      <div className="mt-4 text-primary">{statusMessage}</div>
    </div>
  );
};

export default ConnectWallet;
