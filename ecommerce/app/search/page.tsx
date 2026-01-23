"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  useEffect(() => {
    // Redirect to product page with search query
    if (query) {
      router.replace(`/product?q=${encodeURIComponent(query)}`);
    } else {
      router.replace('/product');
    }
  }, [query, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Хайлт хийж байна...</p>
      </div>
    </div>
  );
}

