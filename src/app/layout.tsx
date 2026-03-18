import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GuinéaManager - ERP pour PME en Guinée",
  description: "Solution ERP complète pour les PME guinéennes. Gestion des factures, clients, employés, paie et dépenses avec calcul automatique des cotisations CNSS et IPR.",
  keywords: ["ERP", "Guinée", "PME", "Facturation", "Paie", "CNSS", "IPR", "Gestion", "Comptabilité"],
  authors: [{ name: "GuinéaManager" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "GuinéaManager - ERP pour PME en Guinée",
    description: "Solution ERP complète pour les PME guinéennes",
    url: "https://guineamanager.com",
    siteName: "GuinéaManager",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GuinéaManager - ERP pour PME en Guinée",
    description: "Solution ERP complète pour les PME guinéennes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
