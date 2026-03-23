import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "P2P FX • Marketplace",
  description: "Buy and sell foreign currency with live offers, fast posting, and direct contact.",
  openGraph: {
    title: "P2P FX Marketplace",
    description: "Trade currency peer-to-peer easily.",
    url: "https://p2p-fx-app-clean-2gbg.vercel.app/",
    siteName: "P2P FX",
    images: [
      {
        url: "/icon.svg",
        width: 800,
        height: 800,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};