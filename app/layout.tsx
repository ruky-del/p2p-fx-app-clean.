import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "P2P FX Marketplace",
  description:
    "A simple peer-to-peer marketplace to buy and sell foreign currency offers with direct WhatsApp contact.",
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