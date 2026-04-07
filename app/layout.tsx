import "./globals.css";
import type { Metadata } from "next";

export const metadata = {
  title: "Rafiki",
  description:
    "Buy and sell foreign currency with live offers, fast posting, and direct contact.",
  keywords: ["forex", "p2p exchange", "currency trading", "TZS", "GBP"],
  openGraph: {
    title: "Exchange with Rafiki",
    description: "Trade currency peer-to-peer easily.",
    url: "https://p2p-fx-app-clean-vgkm.vercel.app",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}