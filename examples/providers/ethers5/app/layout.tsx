import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { VT323 } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const vt323 = VT323({subsets: ["latin"], weight: "400"});

export const metadata: Metadata = {
  title: "Irys Provider Test: Ethers 5",
  description: "Example repo to help test different providers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={vt323.className}>{children}</body>
    </html>
  );
}
