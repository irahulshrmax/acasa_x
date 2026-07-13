// components/PageLoader/index.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface LoaderProps {
  children?: React.ReactNode;
  isLoading?: boolean;
  fullScreen?: boolean;
  minimumLoadTime?: number;
  label?: string;
  subLabel?: string;
}

export default function PageLoader({
  children,
  isLoading = false,
  fullScreen = true,
  minimumLoadTime = 1000,
  label = 'Loading...',
  subLabel = 'Please wait while we prepare your experience',
}: LoaderProps) {
  const [showLoader, setShowLoader] = useState(true);
  const [progress, setProgress] = useState(0);

  // If no children are passed, assume standalone loader
  const standalone = useMemo(() => typeof children === 'undefined', [children]);

  const effectiveLoading = standalone ? true : isLoading;

  useEffect(() => {
    if (!effectiveLoading) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, minimumLoadTime);

      return () => clearTimeout(timer);
    } else {
      setShowLoader(true);
    }
  }, [effectiveLoading, minimumLoadTime]);

  useEffect(() => {
    if (!effectiveLoading) return;

    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1;
        return Math.min(prev + increment, 95);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [effectiveLoading]);

  if (!showLoader && !effectiveLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <AnimatePresence>
        {showLoader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`${
              fullScreen ? 'fixed inset-0 z-[9999]' : 'relative min-h-[200px]'
            } flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100`}
          >
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gray-200/30 blur-3xl" />
              <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gray-300/20 blur-3xl" />
              <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-100/20 blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-6 text-center">
              <div className="relative mb-8">
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 shadow-2xl"
                >
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </motion.div>

                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute -inset-2 rounded-2xl border-2 border-transparent border-r-gray-400/30 border-t-gray-900"
                />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-2 text-xl font-semibold text-gray-800"
              >
                {label}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.65 }}
                transition={{ delay: 0.4 }}
                className="mb-6 max-w-md text-sm text-gray-500"
              >
                {subLabel}
              </motion.p>

              <div className="w-64 max-w-[80%]">
                <div className="relative h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-gray-700 to-gray-900"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs text-gray-400">
                  <span>{progress}%</span>
                  <span>{progress < 100 ? 'Loading' : 'Almost there'}</span>
                </div>
              </div>

              <motion.div
                className="mt-6 flex gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-gray-400"
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!standalone && !effectiveLoading && children}
    </>
  );
}