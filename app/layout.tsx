import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "P2P FX Marketplace",
  description: "Buy and sell foreign currency online",
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
          background: "#f3f6fb",
        }}
      >
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}