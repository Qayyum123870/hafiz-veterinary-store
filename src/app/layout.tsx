import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Hafiz Veterinary Store | ERP & POS System",
  description: "Enterprise Veterinary Pharmacy, Animal Medicines, Pet Care & Inventory Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
