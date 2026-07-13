// components/PerformanceMonitor/index.tsx
'use client';

import { useEffect, useState, useRef } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte
  loadTime: number | null; // Page load time
  domInteractive: number | null;
  domComplete: number | null;
  memoryUsage: number | null;
  navigationType: string;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  logToConsole?: boolean;
  sendToAnalytics?: boolean;
  analyticsEndpoint?: string;
  sampleRate?: number; // 0-1, percentage of sessions to monitor
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  logToConsole = true,
  sendToAnalytics = false,
  analyticsEndpoint = '/api/performance',
  sampleRate = 1,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
    loadTime: null,
    domInteractive: null,
    domComplete: null,
    memoryUsage: null,
    navigationType: 'navigate',
  });

  const metricsSent = useRef(false);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    // Check if monitoring is enabled
    if (!enabled) return;

    // Sample rate check
    if (Math.random() > sampleRate) {
      return;
    }

    // Get navigation type
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        setMetrics(prev => ({
          ...prev,
          navigationType: navEntry.type || 'navigate',
          ttfb: navEntry.responseStart || null,
          domInteractive: navEntry.domInteractive || null,
          domComplete: navEntry.domComplete || null,
        }));
      }
    }

    // Monitor Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            setMetrics(prev => ({
              ...prev,
              lcp: lastEntry.startTime || null,
            }));
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID (First Input Delay) - Fix: use type assertion
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0] as PerformanceEventTiming;
          if (firstEntry) {
            setMetrics(prev => ({
              ...prev,
              fid: firstEntry.processingStart - firstEntry.startTime || null,
            }));
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS (Cumulative Layout Shift)
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          for (const entry of entries) {
            // Use type assertion for LayoutShift
            const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value || 0;
            }
          }
          setMetrics(prev => ({
            ...prev,
            cls: clsValue || null,
          }));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // FCP (First Contentful Paint)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          if (firstEntry) {
            setMetrics(prev => ({
              ...prev,
              fcp: firstEntry.startTime || null,
            }));
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });

        observerRef.current = lcpObserver;

        // Cleanup observers
        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
          fcpObserver.disconnect();
        };
      } catch (error) {
        console.error('PerformanceObserver error:', error);
      }
    }

    // Monitor page load time
    const handleLoad = () => {
      const loadTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        loadTime,
      }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('load', handleLoad);
    }

    // Monitor memory usage (Chrome only)
    let memoryInterval: NodeJS.Timeout | null = null;
    if (typeof window !== 'undefined' && 'memory' in performance) {
      memoryInterval = setInterval(() => {
        try {
          // @ts-ignore - memory is not standard but available in Chrome
          const memory = performance.memory;
          if (memory) {
            setMetrics(prev => ({
              ...prev,
              // @ts-ignore
              memoryUsage: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
            }));
          }
        } catch (error) {
          // Silently fail
        }
      }, 5000);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleLoad);
      }
      if (memoryInterval) {
        clearInterval(memoryInterval);
      }
    };
  }, [enabled, sampleRate]);

  // Send metrics to console and analytics
  useEffect(() => {
    // Check if all metrics are collected
    const allMetricsCollected = metrics.fcp !== null && 
      metrics.lcp !== null && 
      metrics.cls !== null;

    // Don't send if metrics already sent or not all collected
    if (metricsSent.current || !allMetricsCollected) return;

    // Send to console
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metrics:', {
        'FCP (First Contentful Paint)': `${Math.round(metrics.fcp || 0)}ms`,
        'LCP (Largest Contentful Paint)': `${Math.round(metrics.lcp || 0)}ms`,
        'CLS (Cumulative Layout Shift)': (metrics.cls || 0).toFixed(3),
        'FID (First Input Delay)': metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A',
        'TTFB (Time to First Byte)': metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A',
        'Load Time': metrics.loadTime ? `${Math.round(metrics.loadTime)}ms` : 'N/A',
        'Memory Usage': metrics.memoryUsage ? `${Math.round(metrics.memoryUsage * 100)}%` : 'N/A',
        'Navigation Type': metrics.navigationType,
      });
    }

    // Send to analytics
    if (sendToAnalytics && analyticsEndpoint && typeof window !== 'undefined') {
      try {
        const payload = {
          metrics: {
            fcp: metrics.fcp,
            lcp: metrics.lcp,
            cls: metrics.cls,
            fid: metrics.fid,
            ttfb: metrics.ttfb,
            loadTime: metrics.loadTime,
            domInteractive: metrics.domInteractive,
            domComplete: metrics.domComplete,
            memoryUsage: metrics.memoryUsage,
            navigationType: metrics.navigationType,
          },
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        };

        // Send data using beacon API for better reliability
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
          navigator.sendBeacon(analyticsEndpoint, blob);
        } else {
          // Fallback to fetch
          fetch(analyticsEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
          }).catch(error => {
            console.error('Failed to send performance metrics:', error);
          });
        }
      } catch (error) {
        console.error('Failed to send performance metrics:', error);
      }
    }

    metricsSent.current = true;
  }, [metrics, logToConsole, sendToAnalytics, analyticsEndpoint]);

  // Component doesn't render anything visible
  return null;
};