// app/auth/callback/page.tsx
"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  
  useEffect(() => {
    const handleCallback = () => {
      // Get hash fragment from URL
      const hash = window.location.hash.substring(1); // Remove the '#'
      
      if (!hash) {
        console.error('No hash fragment found in callback URL');
        router.push('/login?error=no_data');
        return;
      }
      
      // Parse hash parameters
      const params = new URLSearchParams(hash);
      const error = params.get('error');
      const token = params.get('token');
      const refresh_token = params.get('refresh_token');
      const userStr = params.get('user');
      
      // Handle error case
      if (error) {
        console.error('OAuth error:', error);
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }
      
      // Handle success case
      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // Store authentication data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          if (refresh_token) {
            localStorage.setItem('refresh_token', refresh_token);
          }
          
          // Store in google_auth_data for popup flow compatibility
          localStorage.setItem('google_auth_data', JSON.stringify({
            token,
            refresh_token,
            user
          }));
          
          // Trigger storage event to notify other tabs/windows
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'token',
            newValue: token
          }));
          
          // Also try to close if this is in a popup
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: 'google_auth_success',
              token,
              refresh_token,
              user
            }, window.location.origin);
            
            setTimeout(() => {
              if (window.opener && !window.opener.closed) {
                window.close();
              } else {
                // If popup couldn't be closed, redirect normally
                router.push('/');
              }
            }, 500);
          } else {
            // Not in popup, redirect to home page
            router.push('/');
          }
        } catch (err) {
          console.error('Error parsing user data:', err);
          router.push('/login?error=invalid_data');
        }
      } else {
        console.error('Missing token or user data');
        router.push('/login?error=missing_data');
      }
    };
    
    handleCallback();
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-lg font-semibold text-gray-900">Нэвтэрч байна...</h1>
        <p className="text-gray-600 mt-2">Хүлээгээрэй...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

