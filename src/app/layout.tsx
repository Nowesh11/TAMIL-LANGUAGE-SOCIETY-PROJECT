import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./site.css";

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
    default: "Tamil Language Society | தமிழ் மொழி சங்கம்",
    template: "%s | Tamil Language Society"
  },
  description: "Promoting Tamil language, culture, and heritage through community engagement, education, and cultural events. தமிழ் மொழி, பண்பாடு மற்றும் பாரம்பரியத்தை ஊக்குவிக்கும் சமூக அமைப்பு.",
  keywords: [
    "Tamil language",
    "Tamil culture",
    "Tamil heritage",
    "Tamil community",
    "தமிழ் மொழி",
    "தமிழ் பண்பாடு",
    "தமிழ் சமூகம்",
    "Tamil events",
    "Tamil education",
    "Tamil literature"
  ],
  authors: [{ name: "Tamil Language Society" }],
  creator: "Tamil Language Society",
  publisher: "Tamil Language Society",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'ta-IN': '/ta',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ta_IN'],
    url: '/',
    title: 'Tamil Language Society | தமிழ் மொழி சங்கம்',
    description: 'Promoting Tamil language, culture, and heritage through community engagement, education, and cultural events.',
    siteName: 'Tamil Language Society',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tamil Language Society | தமிழ் மொழி சங்கம்',
    description: 'Promoting Tamil language, culture, and heritage through community engagement, education, and cultural events.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#dc2626" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}


