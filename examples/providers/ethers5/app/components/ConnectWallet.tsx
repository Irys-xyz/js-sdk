"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { ReactTyped } from "react-typed";
import { SiRetroarch } from "react-icons/si"; 

const ConnectWallet = (): JSX.Element => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Not connected");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // State to track connection status

  const connectWallet = async () => {
    //@ts-ignore
    if (typeof window.ethereum !== "undefined") {
      try {
        setIsConnecting(true); // Set connecting status to true
        //@ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
        setStatusMessage(`Connected from ${address}`);
        setIsConnected(true);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      } finally {
        setIsConnecting(false); // Set connecting status to false after connection attempt
      }
    } else {
      console.error("No wallet provider found");
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setStatusMessage("Not connected");
    setWalletAddress(null);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        className="bg-hackerGreen text-hackerBlack font-hacker px-6 py-3 rounded-2xl shadow-md hover:shadow-lg active:translate-y-1 active:shadow-none transition-all duration-150 ease-in-out flex items-center justify-center"
        onClick={isConnected ? disconnectWallet : connectWallet}
      >
        {isConnecting ? (
          <SiRetroarch className="animate-spin text-2xl" /> // Rotating icon while connecting
        ) : isConnected ? (
          "Disconnect Wallet"
        ) : (
          "Connect Wallet"
        )}
      </button>
      <ReactTyped
        className="mt-4 text-hackerGreen font-hacker"
        strings={[statusMessage]}
        typeSpeed={10}
        backSpeed={40}
        cursorChar="_"
        showCursor={true}
        loop={false}
      />
    </div>
  );
};

export default ConnectWallet;
