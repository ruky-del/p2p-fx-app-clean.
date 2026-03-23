import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "P2P FX • Marketplace",
  description:
    "Buy and sell foreign currency with live offers, fast posting, and direct contact.",
  keywords: ["forex", "p2p exchange", "currency trading", "TZS", "GBP"],
  openGraph: {
    title: "P2P FX Marketplace",
    description: "Trade currency peer-to-peer easily.",
    url: "https://p2p-fx-app-clean-2gbg.vercel.app",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#f8fbff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}