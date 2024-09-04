"use client";
import { useState } from "react";
import { ReactTyped } from "react-typed";
import { SiRetroarch } from "react-icons/si";

import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";


import { ethers } from "ethers";

const connectIrys = async () => {
  try {
    //@ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const irysUploader = await WebUploader(WebEthereum).withProvider(provider);
    console.log(`Connected to Irys from ${irysUploader.address}`);
    return `Connected to Irys from ${irysUploader.address}`;
  } catch (error) {
    console.error("Error connecting to WebIrys:", error);
    throw new Error("Error connecting to WebIrys");
  }
};

const ConnectIrys = (): JSX.Element => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Not connected");
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // State to track connection status

  const connectToIrys = async () => {
    setIsConnecting(true);
    try {
      const message = await connectIrys();
      setStatusMessage(message);
      setIsConnected(true);
    } catch (error) {
      console.log(error);
      setStatusMessage("Error connecting to Irys");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromIrys = () => {
    setIsConnected(false);
    setStatusMessage("Not connected");
  };

  return (
    <div className="flex flex-col items-center">
      <button
        className="bg-hackerGreen text-hackerBlack font-hacker px-6 py-3 rounded-2xl shadow-md hover:shadow-lg active:translate-y-1 active:shadow-none transition-all duration-150 ease-in-out flex items-center justify-center"
        onClick={isConnected ? disconnectFromIrys : connectToIrys}
      >
        {isConnecting ? (
          <SiRetroarch className="animate-spin text-2xl" /> // Rotating icon while connecting
        ) : isConnected ? (
          "Disconnect Irys"
        ) : (
          "Connect Irys"
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

export default ConnectIrys;
