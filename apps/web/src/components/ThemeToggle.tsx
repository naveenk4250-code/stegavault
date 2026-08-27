import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme based on localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      applyTheme(initial);
    }
  }, []);

  const applyTheme = (mode: 'light' | 'dark') => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
    localStorage.setItem('theme', mode);
  };

  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle Light and Dark Theme"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="relative w-14 h-7 rounded-none bg-[#EBE7DC] dark:bg-stone-900 border border-[#D6D2C4] dark:border-stone-700 flex items-center justify-between px-1.5 cursor-pointer transition-all active:scale-95 shrink-0 select-none"
    >
      {/* Background Icons (Left = Sun, Right = Moon) */}
      <Sun className={`w-3.5 h-3.5 text-amber-500 transition-opacity duration-200 ${theme === 'dark' ? 'opacity-30' : 'opacity-100'}`} />
      <Moon className={`w-3.5 h-3.5 text-stone-700 dark:text-amber-300 transition-opacity duration-200 ${theme === 'dark' ? 'opacity-100' : 'opacity-30'}`} />

      {/* Symmetrical Sliding Thumb */}
      <div
        className={`absolute top-[3px] left-[3px] w-5 h-5 rounded-none bg-stone-950 dark:bg-[#059669] flex items-center justify-center transition-transform duration-300 ease-in-out shadow-sm ${
          theme === 'dark' ? 'translate-x-[26px]' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3 text-stone-100" />
        ) : (
          <Sun className="w-3 h-3 text-amber-300" />
        )}
      </div>
    </button>
  );
};
