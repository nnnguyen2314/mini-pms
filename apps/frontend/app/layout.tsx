import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import RootContent from '@/shared/components/Layout/RootContent';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Mini PM",
  description: "Mini PM frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <RootContent>{children}</RootContent>
      </body>
    </html>
  );
}
