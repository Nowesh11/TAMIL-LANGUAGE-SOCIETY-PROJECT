/**
 * Utility functions for safely handling bilingual content in React components
 * Prevents "Objects are not valid as React child" errors
 */

import React from 'react';

export type BilingualText = {
  en: string;
  ta: string;
};

export type SafeContent = {
  title?: BilingualText | string;
  subtitle?: BilingualText | string;
  text?: BilingualText | string;
  name?: BilingualText | string;
  heading?: BilingualText | string;
  description?: BilingualText | string;
  alt?: BilingualText | string;
  buttonText?: BilingualText | string;
  [key: string]: any;
};

/**
 * Type guard to check if a value is a bilingual object
 */
export function isBilingualText(value: any): value is BilingualText {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.en === 'string' &&
    typeof value.ta === 'string'
  );
}

/**
 * Type guard to check if a value is a safe string for rendering
 */
export function isSafeString(value: any): value is string {
  return typeof value === 'string';
}

/**
 * Safely extract English string from bilingual content or string
 */
export function getEnglishString(obj: any): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (isBilingualText(obj)) return obj.en;
  return '';
}

/**
 * Safely extract Tamil string from bilingual content or string
 */
export function getTamilString(obj: any): string {
  if (!obj) return '';
  if (isBilingualText(obj)) return obj.ta;
  if (typeof obj === 'string') return obj; // Fallback to string if no bilingual
  return '';
}

/**
 * Get localized string based on language preference
 */
export function getLocalizedString(obj: any, language: 'en' | 'ta' = 'en'): string {
  if (language === 'ta') {
    return getTamilString(obj);
  }
  return getEnglishString(obj);
}

/**
 * Safely render content with fallback for component titles
 */
export function getSafeComponentTitle(content: SafeContent, language: 'en' | 'ta' = 'en'): string {
  const getString = language === 'ta' ? getTamilString : getEnglishString;
  
  return (
    getString(content.title) ||
    getString(content.text) ||
    getString(content.name) ||
    getString(content.heading) ||
    getString(content.description) ||
    (Array.isArray(content.features) && content.features.length > 0 
      ? `${content.features.length} ${language === 'ta' ? 'அம்சங்கள்' : 'Features'}` 
      : '') ||
    (Array.isArray(content.stats) && content.stats.length > 0 
      ? `${content.stats.length} ${language === 'ta' ? 'புள்ளிவிவரங்கள்' : 'Stats'}` 
      : '') ||
    (Array.isArray(content.faqs) && content.faqs.length > 0 
      ? `${content.faqs.length} ${language === 'ta' ? 'கேள்விகள்' : 'FAQs'}` 
      : '') ||
    (Array.isArray(content.links) && content.links.length > 0 
      ? `${content.links.length} ${language === 'ta' ? 'இணைப்புகள்' : 'Links'}` 
      : '') ||
    (Array.isArray(content.testimonials) && content.testimonials.length > 0 
      ? `${content.testimonials.length} ${language === 'ta' ? 'சான்றுகள்' : 'Testimonials'}` 
      : '') ||
    (language === 'ta' ? 'தலைப்பு இல்லை' : 'Untitled Component')
  );
}

/**
 * Ensure a field is properly structured as bilingual
 */
export function ensureBilingualStructure(value: any): BilingualText {
  if (isBilingualText(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    return { en: value, ta: '' };
  }
  
  return { en: '', ta: '' };
}

/**
 * Safely merge bilingual content
 */
export function mergeBilingualContent(
  existing: BilingualText | string | undefined,
  updates: Partial<BilingualText>
): BilingualText {
  const base = ensureBilingualStructure(existing);
  return {
    en: updates.en !== undefined ? updates.en : base.en,
    ta: updates.ta !== undefined ? updates.ta : base.ta
  };
}

// Runtime type checking and safe rendering
export function renderSafe(value: any, language: 'en' | 'ta' = 'en'): string {
  // Runtime check to prevent objects from being rendered
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('en' in value || 'ta' in value) {
      return language === 'ta' ? (value.ta || '') : (value.en || '');
    }
    console.warn('Attempted to render object:', value);
    return '[Object]';
  }
  return String(value || '');
}

// React component for safe text rendering
export interface SafeTextProps {
  value: any;
  language?: 'en' | 'ta';
  fallback?: string;
  className?: string;
}

export const SafeText: React.FC<SafeTextProps> = ({ 
  value, 
  language = 'en',
  fallback = '',
  className 
}) => {
  const text = renderSafe(value, language) || fallback;
  return <span className={className}>{text}</span>;
};