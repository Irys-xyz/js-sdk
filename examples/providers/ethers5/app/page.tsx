import ConnectIrys from "./components/ConnectIrys";
import ConnectWallet from "./components/ConnectWallet";
import UploadText from "./components/UploadText";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col justify-around items-center p-24 bg-black">
      <span className="text-2xl text-primary">Ethers5</span>
      <ConnectWallet />
      <ConnectIrys />
      <UploadText />
    </main>
  );
}
