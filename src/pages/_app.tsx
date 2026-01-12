import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../app/globals.css';
import '../app/site.css';
import '../styles/auth.css';
import { LanguageProvider } from '../hooks/LanguageContext';
import { ThemeProvider } from '../hooks/ThemeContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Register service worker for caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
