"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="dark">
      <ThemeProvider>
        <body className={`${inter.className}  min-h-screen`}>
          <main>{children}</main>
        </body>
      </ThemeProvider>
    </html>
  );
}
