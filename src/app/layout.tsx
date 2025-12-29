import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parcheesi",
  description: "Parcheesi Board Game",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Parcheesi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ backgroundColor: '#000' }}>
      <body className={`${inter.className} bg-black`}>{children}</body>
    </html>
  );
}
