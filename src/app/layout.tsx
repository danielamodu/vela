import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "@mysten/dapp-kit/dist/index.css";
import "./globals.css";
import { Providers } from "./Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Vela — Verifiable AI Dataset Registry",
  description:
    "Publish, discover, and subscribe to AI training datasets anchored on the Sui blockchain with Walrus decentralized storage and AI-generated dataset cards.",
  keywords: ["AI", "datasets", "Sui", "blockchain", "Walrus", "Web3", "machine learning"],
  openGraph: {
    title: "Vela — Verifiable AI Dataset Registry",
    description: "The verifiable AI dataset marketplace on Sui blockchain.",
    type: "website",
  },
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow-condensed",
  weight: ["700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${barlowCondensed.variable}`}>
      <body suppressHydrationWarning className={inter.className}>
        <Providers>
          <Navbar />
          <div className="page-wrapper">
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
