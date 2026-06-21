import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
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
  title: "StyleWithHer | Premium Couple Fashion - Style Together, Stay Together",
  description: "India's premium couple clothing & matching fashion store. Discover matching t-shirts, hoodies, jackets, and accessories for couples. Free shipping on orders above Rs.999.",
  keywords: ["couple clothing", "matching fashion", "couple t-shirts", "couple hoodies", "couple outfits", "StyleWithHer", "premium fashion", "couple wear India"],
  authors: [{ name: "StyleWithHer" }],
  icons: { icon: "https://placehold.co/32x32/0D182A/E91663?text=S" },
  openGraph: {
    title: "StyleWithHer | Premium Couple Fashion",
    description: "Style Together, Stay Together. India's premium couple clothing brand.",
    siteName: "StyleWithHer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}