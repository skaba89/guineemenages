import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

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
    default: "GuinéaManager - ERP pour PME en Afrique de l'Ouest",
    template: "%s | GuinéaManager",
  },
  description: "Solution ERP SaaS complète pour les PME d'Afrique de l'Ouest. Facturation, paie multi-pays, gestion des stocks, et bien plus. 7 pays supportés: Guinée, Sénégal, Mali, Côte d'Ivoire, Burkina Faso, Bénin, Niger.",
  keywords: [
    "ERP", "Guinée", "Sénégal", "Mali", "Côte d'Ivoire", "Burkina Faso", "Bénin", "Niger",
    "PME", "Facturation", "Paie", "CNSS", "IPR", "IR", "Gestion", "Comptabilité", 
    "Mobile Money", "Orange Money", "MTN Money", "SaaS"
  ],
  authors: [{ name: "GuinéaManager Team" }],
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GuinéaManager",
  },
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
  },
  openGraph: {
    title: "GuinéaManager - ERP pour PME en Afrique de l'Ouest",
    description: "Solution ERP SaaS complète pour les PME d'Afrique de l'Ouest. Facturation, paie multi-pays, gestion des stocks.",
    url: "https://guineamanager.com",
    siteName: "GuinéaManager",
    type: "website",
    locale: "fr_GN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GuinéaManager ERP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GuinéaManager - ERP pour PME en Afrique de l'Ouest",
    description: "Solution ERP SaaS complète pour les PME d'Afrique de l'Ouest",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#16a34a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('SW registered: ', registration);
                    },
                    function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
