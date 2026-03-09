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
  title: "GestãoPro ERP - Sistema ERP SaaS para o Brasil",
  description: "Sistema ERP SaaS multi-tenant para o mercado brasileiro. Gestão de produtos, estoque, financeiro, faturamento, PDV e muito mais.",
  keywords: ["ERP", "Gestão", "Brasil", "NF-e", "NFC-e", "PDV", "Estoque", "Financeiro", "SaaS"],
  authors: [{ name: "GestãoPro Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "GestãoPro ERP",
    description: "Sistema ERP SaaS para o mercado brasileiro",
    url: "https://gestaopro.com.br",
    siteName: "GestãoPro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GestãoPro ERP",
    description: "Sistema ERP SaaS para o mercado brasileiro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
