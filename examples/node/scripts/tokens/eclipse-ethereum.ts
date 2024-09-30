import { Uploader }  from "@irys/upload";
import { EclipseEth }  from "@irys/upload-solana";
import "dotenv/config";

/**
 * Tests if data can be uploaded to Irys using Eclipse.
 * 
 * @returns {Promise<boolean>} Returns true if upload is successful, otherwise false.
 */
export const canUploadEclipseEth = async (): Promise<boolean> => {
  try {
    // Initialize the Irys Uploader with the Solana wallet
    const irysUploader = await Uploader(EclipseEth).withWallet(process.env.SOLANA_PRIVATE_KEY);

    // Attempt to upload data to Irys
    //@ts-ignore
    const receipt = await irysUploader.upload("hirys", {
      tags: [{ name: "Content-Type", value: "text/plain" }],
    });

    // If an exception is not thrown, the upload was successful
    // console.log(`Upload successful https://gateway.irys.xyz/${receipt.id}`);
    return true;
  } catch (error) {
    console.error("Error during upload:", error);
    return false;
  }
};
