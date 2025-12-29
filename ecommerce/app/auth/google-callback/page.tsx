// app/auth/google-callback/page.tsx
"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        // Send error to parent window
        window.opener?.postMessage({
          type: 'google_auth_error',
          error,
          message: 'Authentication failed'
        }, window.location.origin);
        return;
      }
      
      if (!code) {
        window.opener?.postMessage({
          type: 'google_auth_error',
          error: 'no_code',
          message: 'No authorization code received'
        }, window.location.origin);
        return;
      }
      
      try {
        // Send code to backend
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/auth/google/callback?code=${code}`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.token && data.user) {
          // Success - send data to parent window
          window.opener?.postMessage({
            type: 'google_auth_success',
            token: data.token,
            refresh_token: data.refresh_token,
            user: data.user
          }, window.location.origin);
          
          // Optional: Close after a short delay
          setTimeout(() => {
            window.close();
          }, 1000);
        } else {
          // Error from backend
          window.opener?.postMessage({
            type: 'google_auth_error',
            error: 'backend_error',
            message: data.message || 'Authentication failed'
          }, window.location.origin);
        }
      } catch (err) {
        console.error('Callback error:', err);
        window.opener?.postMessage({
          type: 'google_auth_error',
          error: 'fetch_error',
          message: 'Failed to authenticate with server'
        }, window.location.origin);
      }
    };
    
    handleCallback();
  }, [searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-lg font-semibold text-gray-900">Google нэвтэрч байна...</h1>
        <p className="text-gray-600 mt-2">Хүлээгээрэй...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}