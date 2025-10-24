
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { AnimatedLogo } from '@/components/icons/AnimatedLogo';
import { useAppContext } from '@/context/AppContext';

export function PageTransitionLoader({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isPageTransitioning, setIsPageTransitioning } = useAppContext();

  // Hide the loader whenever the pathname changes (which means navigation is complete)
  useEffect(() => {
    if (isPageTransitioning) {
      setIsPageTransitioning(false);
    }
  }, [pathname]);


  return (
    <>
      <AnimatePresence>
        {isPageTransitioning && (
          <motion.div
            key="page-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/50 backdrop-blur-sm"
          >
            <AnimatedLogo />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
