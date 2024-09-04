"use client";
import { useState } from "react";
import { SiRetroarch } from "react-icons/si";
import Link from "next/link"; 

import { sepolia } from "viem/chains";
import { createWalletClient, createPublicClient, custom } from "viem";

import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { ViemV2Adapter } from "@irys/web-upload-ethereum-viem-v2";

const getIrysUploader = async () => {
  try {
    //@ts-ignore
    const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = createWalletClient({
      account,
      chain: sepolia,
      //@ts-ignore
      transport: custom(window.ethereum),
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      //@ts-ignore
      transport: custom(window.ethereum)
    });

    const irysUploader = await WebUploader(WebEthereum).withAdapter(ViemV2Adapter(provider, { publicClient }));
    return irysUploader;
  } catch (error) {
    console.error("Error connecting to Irys:", error);
    throw new Error("Error connecting to Irys");
  }
};

const UploadText = (): JSX.Element => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [textData, setTextData] = useState<string>(""); 
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null); 

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const irysUploader = await getIrysUploader();
      const tags = [{ name: "Content-Type", value: "text/plain" }];
      //@ts-ignore
      const receipt = await irysUploader.upload(textData, { tags });

      const url = `https://gateway.irys.xyz/${receipt.id}`;
      setUploadedUrl(url); 
      setStatusMessage("Data uploaded successfully");
    } catch (error) {
      setStatusMessage("Error uploading data");
      setUploadedUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const truncateUrl = (url: string): string => {
    const id = url.split('/').pop();
    if (id && id.length > 10) {
      return `${id.substring(0, 5)}...${id.substring(id.length - 5)}`;
    }
    return url;
  };

  return (
    <div className="border-2 border-primary rounded-2xl p-4 w-full max-w-md">
      <div className="flex flex-row items-center mb-4">
        <input
          type="text"
          placeholder="Enter text to upload"
          className="border border-primary rounded-l-2xl px-3 py-2 flex-grow text-black"
          value={textData}
          onChange={(e) => setTextData(e.target.value)}
        />
        <button
          className="bg-primary text-secondary px-4 py-2 rounded-r-2xl shadow-md hover:shadow-lg active:translate-y-1 active:shadow-none transition-all duration-150 ease-in-out flex items-center justify-center"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? <SiRetroarch className="animate-spin text-2xl" /> : "Upload"}
        </button>
      </div>

      <div className="mt-4 text-primary">
        {statusMessage}
        {uploadedUrl && (
          <div>
            <Link
              href={uploadedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary font-bold hover:no-underline text-sm"
            >
              https://gateway.irys.xyz/{truncateUrl(uploadedUrl)}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadText;
