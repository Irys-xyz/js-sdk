"use client";
import { useState } from "react";
import { SiRetroarch } from "react-icons/si";
import Link from "next/link";

import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";

import { ethers } from "ethers";

const getIrysUploader = async () => {
  try {
    //@ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const irysUploader = await WebUploader(WebEthereum).withProvider(provider);
    //@ts-ignore
    console.log(`Connected to Irys from ${irysUploader.address}`);
    return irysUploader;
  } catch (error) {
    console.error("Error connecting to WebIrys:", error);
    throw new Error("Error connecting to WebIrys");
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
      console.error(error);
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
      {/* First Row: Text field and Upload button */}
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

      {/* Second Row: Status message */}
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
