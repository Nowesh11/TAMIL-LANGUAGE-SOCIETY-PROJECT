import type { AppProps } from 'next/app';
import '../app/globals.css';
import '../app/site.css';
import { LanguageProvider } from '../hooks/LanguageContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  );
}
