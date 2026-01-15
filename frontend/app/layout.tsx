import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { MaintenanceBanner } from "@/components/admin/MaintenanceBanner";

const rubik = Rubik({
  subsets: ["latin", "hebrew"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "CLICK - HR Platform",
  description: "SaaS HR Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body className="font-sans antialiased">
        <MaintenanceBanner />
        {children}
      </body>
    </html>
  );
}
