// Initial setup - 2025-10-24T15:36:52.596Z
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/theme-provider";
import { Web3Provider } from "@/components/Web3Provider";
import { ToastContainer } from "@/components/Toast";
import { ToastProvider } from "@/lib/toast-context";
import { Suspense } from "react";
// Fixed layout edge cases


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Base Studio",
  description:
    "Decentralized image editing and tokenization platform built on Base. Create, edit, and monetize your photography onchain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <Web3Provider>
          <ThemeProvider>
            <ToastProvider>
              <Suspense fallback={<div className="min-h-screen bg-[var(--background)]" />}>
                {children}
              </Suspense>
              <ToastContainer />
            </ToastProvider>
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
