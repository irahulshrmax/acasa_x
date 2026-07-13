// hooks/useDeviceDetection.ts
import { useEffect, useState } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLowPerformance: boolean;
  isTouchDevice: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  memory: number | null;
  cores: number | null;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLowPerformance: false,
    isTouchDevice: false,
    deviceType: 'desktop',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
    memory: null,
    cores: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Check if touch device
      const isTouchDevice = 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - msMaxTouchPoints is IE specific
        window.navigator.msMaxTouchPoints > 0;

      // Determine device type based on screen width
      let isMobile = false;
      let isTablet = false;
      let isDesktop = true;
      let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

      if (width < 768) {
        isMobile = true;
        isDesktop = false;
        deviceType = 'mobile';
      } else if (width >= 768 && width < 1024) {
        isTablet = true;
        isDesktop = false;
        deviceType = 'tablet';
      } else {
        isDesktop = true;
        deviceType = 'desktop';
      }

      // Detect low performance devices
      let isLowPerformance = false;
      
      // Check for low memory (Chrome only)
      // @ts-ignore - navigator.deviceMemory is not standard
      const memory = navigator.deviceMemory || null;
      
      // Check for CPU cores
      // @ts-ignore - navigator.hardwareConcurrency is not standard
      const cores = navigator.hardwareConcurrency || null;

      // Low performance criteria:
      // - Less than 4GB RAM (if available)
      // - Less than 4 CPU cores (if available)
      // - Low pixel ratio on mobile
      // - Older mobile devices
      if (memory !== null && memory < 4) {
        isLowPerformance = true;
      } else if (cores !== null && cores < 4) {
        isLowPerformance = true;
      } else if (isMobile && pixelRatio < 2) {
        isLowPerformance = true;
      } else if (isMobile && width < 375) {
        isLowPerformance = true;
      } else if (
        // Detect older Android/iOS versions
        /Android [0-5]/.test(navigator.userAgent) ||
        /iPhone OS [0-9]_[0-9]/.test(navigator.userAgent) ||
        /iPad.*OS [0-9]_[0-9]/.test(navigator.userAgent)
      ) {
        isLowPerformance = true;
      }

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isLowPerformance,
        isTouchDevice,
        deviceType,
        screenWidth: width,
        screenHeight: height,
        pixelRatio,
        memory,
        cores,
      });
    };

    // Initial detection
    detectDevice();

    // Add resize listener
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(detectDevice, 250);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', detectDevice);
      clearTimeout(timeoutId);
    };
  }, []);

  return deviceInfo;
};