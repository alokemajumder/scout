'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AltchaCaptchaProps {
  challengeurl: string;
  onVerified?: (payload: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  disabled?: boolean;
}

interface AltchaElement extends HTMLElement {
  reset(): void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'altcha-widget': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          challengeurl?: string;
          hidefooter?: boolean;
          hidelogo?: boolean;
          name?: string;
          strings?: string;
        },
        HTMLElement
      >;
    }
  }
}

export default function AltchaCaptcha({
  challengeurl,
  onVerified,
  onError,
  className = '',
  disabled = false,
}: AltchaCaptchaProps) {
  const widgetRef = useRef<AltchaElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="altcha"]');
    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    // Load ALTCHA web component script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/altcha-lib@latest/dist/altcha.min.js';
    script.type = 'module';
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error('Failed to load ALTCHA script');
      onError?.(new Error('Failed to load captcha'));
    };
    document.head.appendChild(script);

    return () => {
      // Only remove if script exists and no other components are using it
      if (script.parentNode) {
        try {
          document.head.removeChild(script);
        } catch (e) {
          // Script already removed, ignore error
        }
      }
    };
  }, [onError]);

  useEffect(() => {
    if (!isLoaded || !widgetRef.current) return;

    const widget = widgetRef.current;

    const handleStateChange = (event: CustomEvent) => {
      if (event.detail.state === 'verified' && event.detail.payload) {
        onVerified?.(event.detail.payload);
      } else if (event.detail.state === 'error') {
        onError?.(new Error(event.detail.error || 'Captcha verification failed'));
      }
    };

    // Add event listener with proper typing
    widget.addEventListener('statechange', handleStateChange as EventListener);

    return () => {
      widget.removeEventListener('statechange', handleStateChange as EventListener);
    };
  }, [isLoaded, onVerified, onError]);

  const resetCaptcha = () => {
    if (widgetRef.current && 'reset' in widgetRef.current) {
      (widgetRef.current as AltchaElement).reset();
    }
  };

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center p-6 glass dark:glass-dark border border-web3-violet-200 dark:border-web3-violet-800/30 rounded-xl ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-web3-violet-600 border-t-transparent"></div>
            <div className="absolute inset-0 rounded-full bg-web3-violet-500/20 animate-pulse"></div>
          </div>
          <span className="text-sm font-medium bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-purple-400 bg-clip-text text-transparent">
            Loading security verification...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`altcha-container ${className}`}>
      <altcha-widget
        ref={widgetRef as any}
        challengeurl={challengeurl}
        hidefooter={false}
        hidelogo={false}
        style={{ 
          opacity: disabled ? 0.5 : 1, 
          pointerEvents: disabled ? 'none' : 'auto' 
        }}
      />
      {process.env.NODE_ENV === 'development' && (
        <button
          type="button"
          onClick={resetCaptcha}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
        >
          Reset Captcha (Dev)
        </button>
      )}
    </div>
  );
}