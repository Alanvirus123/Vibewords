
"use client";

import type { PropsWithChildren } from 'react';
import { useState, useEffect } from 'react';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster";

interface ClientLayoutWrapperProps extends PropsWithChildren {
  themeProviderProps: Omit<ThemeProviderProps, 'children'>;
}

export default function ClientLayoutWrapper({ children, themeProviderProps }: ClientLayoutWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ThemeProvider {...themeProviderProps}>
      {children}
      {mounted && <Toaster />}
    </ThemeProvider>
  );
}
