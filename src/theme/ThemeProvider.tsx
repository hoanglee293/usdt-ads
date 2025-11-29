"use client";
import React, { createContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialTheme
}) => {
  const [mounted, setMounted] = useState(false);
  // Kiểm tra localStorage trước, nếu không có thì mới dùng initialTheme hoặc 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('appTheme') as Theme | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
    }
    return initialTheme || 'light';
  });

  useEffect(() => {
    setMounted(true);
    // Đồng bộ với DOM (script trong head đã set rồi)
    const root = document.documentElement;
    const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
    const storedTheme = localStorage.getItem('appTheme') as Theme | null;
    
    // Nếu có trong localStorage, đảm bảo DOM và state đồng bộ
    if (storedTheme === 'light' || storedTheme === 'dark') {
      if (currentTheme !== storedTheme) {
        setTheme(storedTheme);
      }
    } else {
      // Nếu không có trong localStorage, kiểm tra system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('appTheme', theme);
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

