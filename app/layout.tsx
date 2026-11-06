import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
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
  title: {
    default: "FleetOps 360 | Pemantau BBM & Armada",
    template: "%s | FleetOps 360",
  },
  description:
    "Platform operasional armada untuk memantau BBM, servis kendaraan, reimbursement, dan aktivitas driver.",
  applicationName: "FleetOps 360",
  metadataBase: new URL("https://pemantau-bbm.vercel.app"),
  openGraph: {
    title: "FleetOps 360 | Pemantau BBM & Armada",
    description:
      "Kelola pemantauan BBM, perawatan kendaraan, dan aktivitas armada dari satu platform.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
