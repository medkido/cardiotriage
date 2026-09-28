import type { Metadata } from "next";
import { Lora, Inter } from "next/font/google";
import "./globals.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-serif", weight: ["500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Pediatric Chest Pain Triage",
  description: "Red-flag based triage support for pediatric chest pain"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${lora.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
