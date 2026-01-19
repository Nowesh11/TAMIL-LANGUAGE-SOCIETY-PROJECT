import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "../hooks/LanguageContext";
import { ThemeProvider } from "../hooks/ThemeContext";
import ErrorBoundary from "../components/ErrorBoundary";
import ReactQueryProvider from "../components/ReactQueryProvider";
import ToasterProvider from "../components/ToasterProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
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

import Navbar from "../components/NavBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      </head>
      <body
        className={`${inter.variable} ${poppins.variable} antialiased min-h-screen bg-background text-foreground font-sans`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <ReactQueryProvider>
              <ToasterProvider />
              <ErrorBoundary>
                <div id="root" className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-grow">
                    {children}
                  </main>
                </div>
              </ErrorBoundary>
            </ReactQueryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
