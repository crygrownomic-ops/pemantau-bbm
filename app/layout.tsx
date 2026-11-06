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
  title: "FleetOps 360 | Pemantau BBM & Armada",
  description:
    "Dashboard premium untuk monitoring konsumsi BBM, servis, reimbursement, dan kinerja armada kendaraan.",
  metadataBase: new URL("https://pemantau-bbm.vercel.app"),
  keywords: [
    "FleetOps",
    "pemantau BBM",
    "armada",
    "monitoring kendaraan",
    "admin dashboard",
    "driver portal",
  ],
  openGraph: {
    title: "FleetOps 360",
    description: "Platform operasi armada modern untuk pengelolaan BBM, servis, dan reimbursement.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
