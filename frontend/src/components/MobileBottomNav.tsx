'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState } from 'react';
import { ConversationalStepper } from './ConversationalStepper';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isStepperOpen, setIsStepperOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/', icon: '🏠' },
    { label: 'Circles', href: '/dashboard', icon: '🏛️' },
    { label: 'Trust SBT', href: '/profile', icon: '🛡️' },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t-2 border-border shadow-hard-lg px-2 py-1.5 flex items-center justify-around safe-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded transition-all ${
                isActive
                  ? 'text-turmeric font-bold'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{item.icon}</span>
              <span className="text-[10px] font-mono tracking-tight">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 bg-turmeric rounded-full mt-0.5" />}
            </Link>
          );
        })}

        {/* Create Circle Mobile Action Button */}
        <button
          onClick={() => setIsStepperOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 bg-turmeric text-ink border-2 border-border font-bold rounded shadow-hard-sm active:translate-y-0.5 transition-all"
        >
          <span className="text-base leading-none">➕</span>
          <span className="text-[10px] font-mono font-black uppercase">Create</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="flex flex-col items-center justify-center py-1 px-3 text-text-muted hover:text-text-primary transition-all"
        >
          <span className="text-lg leading-none mb-0.5">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="text-[10px] font-mono">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <ConversationalStepper
        isOpen={isStepperOpen}
        onClose={() => setIsStepperOpen(false)}
      />
    </>
  );
}
