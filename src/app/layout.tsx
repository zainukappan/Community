import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Community Organization Management System",
  description: "A professional portal for community organization administration, campaigns and directories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${outfit.variable} font-sans min-h-full bg-slate-50 text-slate-800 antialiased flex flex-col`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
