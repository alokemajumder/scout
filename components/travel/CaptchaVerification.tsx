'use client';

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import AltchaCaptcha from '@/components/ui/altcha-captcha';
import { Card } from '@/components/ui/card';

interface CaptchaVerificationProps {
  onVerified: (payload: string) => void;
  isVerified: boolean;
  className?: string;
}

export default function CaptchaVerification({ 
  onVerified, 
  isVerified, 
  className = '' 
}: CaptchaVerificationProps) {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCaptchaVerified = (payload: string) => {
    setError('');
    setIsLoading(false);
    onVerified(payload);
  };

  const handleCaptchaError = (error: Error) => {
    setError(error.message);
    setIsLoading(false);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-web3-violet-500 to-web3-purple-500 rounded-full flex items-center justify-center mx-auto shadow-neon">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-web3-violet-600 to-web3-purple-600 dark:from-web3-violet-400 dark:to-web3-pink-400 bg-clip-text text-transparent">Security Verification</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please complete the security check to generate your travel plan
        </p>
      </div>

      {/* Captcha Card */}
      <Card className="p-6 glass dark:glass-dark border-web3-violet-200 dark:border-web3-violet-800/30 shadow-web3">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-web3-violet-600 dark:text-web3-violet-400" />
            <h3 className="font-medium text-gray-900 dark:text-white">Verify you&apos;re human</h3>
          </div>
          
          {/* Development Notice */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm text-amber-800 dark:text-amber-300">
                  Development mode: Captcha verification is optional
                </span>
              </div>
            </div>
          )}

          {/* ALTCHA Captcha Widget */}
          <div className="flex justify-center">
            <AltchaCaptcha
              challengeurl="/api/captcha/challenge"
              onVerified={handleCaptchaVerified}
              onError={handleCaptchaError}
              className="max-w-md"
              disabled={isLoading}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {/* Success Display */}
          {isVerified && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-800 dark:text-green-300">
                  ✓ Security verification completed successfully
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          This helps us prevent automated requests and keep Scout secure
        </p>
      </div>
    </div>
  );
}