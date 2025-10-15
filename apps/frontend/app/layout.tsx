import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import RootContent from '@/shared/components/Layout/RootContent';
import DatadogInit from './DatadogInit';

const geistSans = localFont({
  src: "../public/assets/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "../public/assets/fonts/GeistMonoVF.woff",
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
        <DatadogInit />
        <RootContent>{children}</RootContent>
      </body>
    </html>
  );
}
