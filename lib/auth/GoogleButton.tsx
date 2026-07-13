'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleButtonProps {
  mode?: 'login' | 'register';
  onSuccess: (credential: string) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleButton({ mode = 'login', onSuccess, onError }: GoogleButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID is missing');
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initializeGoogle, 500);
        return;
      }

      if (!buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError?.(new Error('No credential received'));
            }
          },
          cancel_on_tap_outside: false,
          auto_select: false,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'login' ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width: '100%',
        });

        setIsLoaded(true);
      } catch (error) {
        console.error('Google initialization error:', error);
        onError?.(error);
      }
    };

    if (document.querySelector('#google-script')) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
      onError?.(new Error('Failed to load Google script'));
    };
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('#google-script');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [mode, onSuccess, onError]);

  return (
    <div className="flex justify-center w-full">
      <div 
        ref={buttonRef} 
        className="w-full max-w-[380px] min-h-[44px]"
        style={{ minHeight: '44px' }}
      />
    </div>
  );
}