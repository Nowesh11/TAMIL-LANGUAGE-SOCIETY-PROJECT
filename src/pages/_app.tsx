import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { Inter, Poppins } from 'next/font/google';
import '../app/globals.css';
import { LanguageProvider } from '../hooks/LanguageContext';
import { ThemeProvider } from '../hooks/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import ToasterProvider from '../components/ToasterProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Unregister any existing service workers to fix the login/cache issues
    // We will re-enable this later once the cache issues are fully resolved
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToasterProvider />
          <div className={`${inter.variable} ${poppins.variable} font-sans min-h-screen bg-background text-foreground`}>
            <Component {...pageProps} />
          </div>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
