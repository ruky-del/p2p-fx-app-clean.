import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rafiki Exchange",
  description: "Exchange with Rafiki",
  manifest: "/manifest.json",

  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },

  themeColor: "#0b1220",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rafiki",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}

        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js');
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}