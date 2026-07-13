// lib/auth/GoogleSignIn.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInProps {
  onSuccess?: () => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function saveSession(token: string, user: any) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
}

// ════════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════════

export default function GoogleSignIn({
  onSuccess,
  text = 'continue_with',
}: GoogleSignInProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const buttonRef    = useRef<HTMLDivElement>(null);

  // ── Google credential handler ────────────────────────────────
  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      toast.error('Google sign-in failed');
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/google', {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
        body    : JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || 'Google sign-in failed');
        return;
      }

      // ── Save session ─────────────────────────────────────────
      saveSession(data.data.token, data.data.user);

      toast.success(data.data.message || 'Welcome!');
      onSuccess?.();

      const redirect = searchParams.get('redirect')
        || data.data.redirectTo
        || '/';

      router.push(redirect);

    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed');
    }
  };

  // ── Initialize Google ────────────────────────────────────────
  const initializeGoogle = () => {
    if (!window.google?.accounts) return;
    if (!buttonRef.current)       return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing');
      return;
    }

    window.google.accounts.id.initialize({
      client_id           : clientId,
      callback            : handleCredentialResponse,
      cancel_on_tap_outside: false,
      auto_select         : false,
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type           : 'standard',
      theme          : 'outline',
      size           : 'large',
      text,
      shape          : 'rectangular',
      logo_alignment : 'center',
      width          : 360,
    });
  };

  // ── Load script ──────────────────────────────────────────────
  useEffect(() => {
    // Already loaded
    if (window.google?.accounts) {
      initializeGoogle();
      return;
    }

    // Already in DOM
    if (document.querySelector('#google-gsi-script')) {
      // Wait for it to load
      const check = setInterval(() => {
        if (window.google?.accounts) {
          clearInterval(check);
          initializeGoogle();
        }
      }, 100);
      return () => clearInterval(check);
    }

    // Inject script
    const script    = document.createElement('script');
    script.id       = 'google-gsi-script';
    script.src      = 'https://accounts.google.com/gsi/client';
    script.async    = true;
    script.defer    = true;
    script.onload   = initializeGoogle;
    script.onerror  = () => {
      console.error('❌ Failed to load Google Sign-In script');
      toast.error('Failed to load Google Sign-In');
    };

    document.head.appendChild(script);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // ════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
    </div>
  );
}