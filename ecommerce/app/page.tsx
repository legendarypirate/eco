// app/page.tsx - Updated version
"use client";

import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedProducts from './components/FeaturedProducts';
import Footer from './components/Footer';
import DemandedProducts from './components/DemandedProducts';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      <Hero />
      <FeaturedProducts />
      <DemandedProducts />
      <Footer />
    </div>
  );
}