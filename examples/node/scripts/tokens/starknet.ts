import { Uploader }  from "@irys/upload";
import { Starknet, StarknetEth, StarknetToken } from "@irys/upload-starknet-node";
import "dotenv/config";

/**
 * Tests if data can be uploaded to Irys using USDCPolygon.
 * 
 * @returns {Promise<boolean>} Returns true if upload is successful, otherwise false.
 */
export const canUploadStarknet = async (): Promise<boolean> => {3
  try {
    // Initialize the Irys Uploader with the Ethereum wallet
    const irysUploader = await Uploader(Starknet).withWallet("0x005d5c250b5c181684ae6d8ebfa0faeac3ad0c6f31a6c2f102a2fffddba00a05");

    // Attempt to upload data to Irys
    //@ts-ignore
    const receipt = await irysUploader.upload("hirys", {
      tags: [{ name: "Content-Type", value: "text/plain" }],
    });

    console.log('reciept:', receipt)

    // If an exception is not thrown, the upload was successful
    // console.log(`Upload successful https://gateway.irys.xyz/${receipt.id}`);
    return true;
  } catch (error) {
    console.error("Error during upload:", error);
    return false;
  }
};
const privateKey = "0x005d5c250b5c181684ae6d8ebfa0faeac3ad0c6f31a6c2f102a2fffddba00a05";
const address = "0x02F659cf8CCE41168B8c0A8BedCE468E33BE1B7bd26E920266C025Dc0F8FBD1b"

const TokenConfigTrimmed = {
    privateKey,
    address,
}
