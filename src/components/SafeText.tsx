import React from 'react';

interface BilingualText {
  en?: string;
  ta?: string;
}

interface SafeTextProps {
  text: string | BilingualText | null | undefined;
  lang?: 'en' | 'ta';
  fallback?: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * SafeText component for rendering bilingual text objects safely
 * Prevents "Objects are not valid as a React child" errors
 */
export const SafeText: React.FC<SafeTextProps> = ({
  text,
  lang = 'en',
  fallback = '',
  className,
  as: Component = 'span',
}) => {
  const getSafeText = (): string => {
    // Handle null/undefined
    if (!text) return fallback;
    
    // Handle string directly
    if (typeof text === 'string') return text;
    
    // Handle bilingual object
    if (typeof text === 'object' && text !== null) {
      const bilingualText = text as BilingualText;
      
      // Try requested language first
      if (bilingualText[lang]) return bilingualText[lang]!;
      
      // Fallback to other language
      const otherLang = lang === 'en' ? 'ta' : 'en';
      if (bilingualText[otherLang]) return bilingualText[otherLang]!;
      
      // Try toString as last resort
      try {
        const stringified = text.toString();
        if (stringified !== '[object Object]') return stringified;
      } catch (e) {
        console.warn('SafeText: Failed to stringify object', text);
      }
    }
    
    return fallback;
  };

  const safeText = getSafeText();
  
  return <Component className={className}>{safeText}</Component>;
};

/**
 * Hook for getting safe text values
 */
export const useSafeText = () => {
  return (text: string | BilingualText | null | undefined, lang: 'en' | 'ta' = 'en', fallback: string = ''): string => {
    if (!text) return fallback;
    if (typeof text === 'string') return text;
    
    if (typeof text === 'object' && text !== null) {
      const bilingualText = text as BilingualText;
      return bilingualText[lang] || bilingualText[lang === 'en' ? 'ta' : 'en'] || fallback;
    }
    
    return fallback;
  };
};

/**
 * Utility function for safe text extraction
 */
export const getSafeText = (
  text: string | BilingualText | null | undefined,
  lang: 'en' | 'ta' = 'en',
  fallback: string = ''
): string => {
  if (!text) return fallback;
  if (typeof text === 'string') return text;
  
  if (typeof text === 'object' && text !== null) {
    const bilingualText = text as BilingualText;
    return bilingualText[lang] || bilingualText[lang === 'en' ? 'ta' : 'en'] || fallback;
  }
  
  return fallback;
};

export default SafeText;