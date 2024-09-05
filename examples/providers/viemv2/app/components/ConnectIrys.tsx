"use client";
import { useState } from "react";
import { SiRetroarch } from "react-icons/si";
import { sepolia } from "viem/chains";
import { createWalletClient, createPublicClient, custom } from "viem";

import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { ViemV2Adapter } from "@irys/web-upload-ethereum-viem-v2";

// Function to connect to WebIrys
const doConnectIrys = async (): Promise<string> => {
  try {
    //@ts-ignore
    const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
    console.log({account})
    const provider = createWalletClient({
      account,
      chain: sepolia,
      //@ts-ignore
      transport: custom(window.ethereum),
    });
    console.log({provider})

    const publicClient = createPublicClient({
      chain: sepolia,
      //@ts-ignore
      transport: custom(window.ethereum)
    });
    console.log({publicClient})

    const irysUploader = await WebUploader(WebEthereum).withAdapter(ViemV2Adapter(provider, { publicClient }));
    
    console.log(`Connected to Irys from ${irysUploader.address}`);
    return `Connected to Irys from ${irysUploader.address}`;
  } catch (error) {
    console.error("Error connecting to Irys:", error);
    throw new Error("Error connecting to Irys");
  }
};

const ConnectIrys = (): JSX.Element => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("Not connected");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connectToIrys = async () => {
    setIsConnecting(true);
    try {
      const message = await doConnectIrys();
      setStatusMessage(message);
      setIsConnected(true);
    } catch (error) {
      setStatusMessage("Error connecting to WebIrys");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromIrys = () => {
    setIsConnected(false);
    setStatusMessage("Not connected");
  };

  return (
    <div className="border-2 border-primary rounded-2xl p-4 w-full max-w-md">
      <button
        className="bg-primary text-secondary px-6 py-3 rounded-2xl shadow-md hover:shadow-lg active:translate-y-1 active:shadow-none transition-all duration-150 ease-in-out flex items-center justify-center"
        onClick={isConnected ? disconnectFromIrys : connectToIrys}
      >
        {isConnecting ? (
          <SiRetroarch className="animate-spin text-2xl" />
        ) : isConnected ? (
          "Disconnect Irys"
        ) : (
          "Connect Irys"
        )}
      </button>
      <div className="mt-4 text-primary">{statusMessage}</div>
    </div>
  );
};

export default ConnectIrys;
