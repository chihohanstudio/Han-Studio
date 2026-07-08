import type { Metadata } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const crimson = Crimson_Text({
  weight: ["400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Chi Ho Han Studio",
  description: "Lesson booking and studio management for Chi Ho Han Studio"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${crimson.variable}`}>
      <body className="min-h-screen bg-page font-sans text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
