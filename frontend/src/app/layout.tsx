import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bill Splitter - Split Bills Made Easy",
  description:
    "A Progressive Web App for splitting bills among friends and colleagues easily",
  keywords: ["bill splitter", "expense sharing", "PWA", "split bills"],
  authors: [{ name: "Bill Splitter Team" }],
  metadataBase: new URL("https://localhost:3000"), // Change to your domain in production
  openGraph: {
    title: "Bill Splitter",
    description: "Split bills easily with friends using smart OCR technology",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bill Splitter",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
