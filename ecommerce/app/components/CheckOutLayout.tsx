// app/components/CheckoutLayout.tsx
"use client";

import { ReactNode, memo } from 'react';
import Header from './Header';
import Footer from './Footer';

interface CheckoutLayoutProps {
  children: ReactNode;
}

const CheckoutLayout = memo(({ children }: CheckoutLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {children}
      <Footer />
    </div>
  );
});

CheckoutLayout.displayName = 'CheckoutLayout';

export default CheckoutLayout;