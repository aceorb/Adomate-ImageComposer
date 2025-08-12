'use client';

import { useState, useEffect } from 'react';
import { GoogleFont, GoogleFontsResponse } from '@/types';

const GOOGLE_FONTS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;

export const useGoogleFonts = () => {
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const url = GOOGLE_FONTS_API_KEY 
          ? `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}`
          : 'https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch Google Fonts');
        }
        
        const data: GoogleFontsResponse = await response.json();
        setFonts(data.items.slice(0, 100)); // Limit to first 100 fonts for performance
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to basic fonts if API fails
        setFonts([
          { family: 'Arial', variants: ['400', '700'], subsets: ['latin'], version: '', lastModified: '', files: {} },
          { family: 'Georgia', variants: ['400', '700'], subsets: ['latin'], version: '', lastModified: '', files: {} },
          { family: 'Times New Roman', variants: ['400', '700'], subsets: ['latin'], version: '', lastModified: '', files: {} },
          { family: 'Helvetica', variants: ['400', '700'], subsets: ['latin'], version: '', lastModified: '', files: {} },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFonts();
  }, []);

  const loadFont = (fontFamily: string, fontWeight: string = '400') => {
    if (!document.querySelector(`link[href*="${fontFamily.replace(' ', '+')}"]`)) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@${fontWeight}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  };

  return { fonts, loading, error, loadFont };
};