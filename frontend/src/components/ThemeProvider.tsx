'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isMobilePreview: boolean;
  toggleMobilePreview: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  isMobilePreview: false,
  toggleMobilePreview: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check saved theme or system preference
    const saved = localStorage.getItem('bhishi-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      // Default to dark for high-contrast rich web3 aesthetic
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('bhishi-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleMobilePreview = () => {
    setIsMobilePreview((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isMobilePreview, toggleMobilePreview }}>
      <div className={isMobilePreview ? 'mobile-simulator-wrapper' : ''}>
        {isMobilePreview ? (
          <div className="mobile-frame-container">
            <div className="mobile-phone-frame">
              <div className="mobile-phone-notch">
                <div className="notch-speaker" />
                <div className="notch-camera" />
              </div>
              <div className="mobile-phone-screen">{children}</div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
