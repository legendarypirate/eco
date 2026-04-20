// app/page.tsx - Updated version
"use client";

import { useEffect, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedProducts from './components/FeaturedProducts';
import Footer from './components/Footer';
import DemandedProducts from './components/DemandedProducts';
import Partners from './components/Partners';
import { X } from 'lucide-react';
import { useAuth } from './context/AuthContext';

interface PopupBanner {
  id: string | number;
  image: string;
  text?: string;
  link?: string;
}

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [popupBanner, setPopupBanner] = useState<PopupBanner | null>(null);

  useEffect(() => {
    document.title = 'Нүүр хуудас | TSAAS';
  }, []);

  useEffect(() => {
    const loadPopupBanner = async () => {
      if (isLoading || isAuthenticated) {
        setShowPromoModal(false);
        setPopupBanner(null);
        return;
      }
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${API_URL}/banner/published?placement=popup`);
        if (!res.ok) {
          setPopupBanner({
            id: 'default',
            image: '/bichgiin.png',
            text: 'Хамгийн сүүлийн үеийн чанартай бичгийн цаас',
          });
          setShowPromoModal(true);
          return;
        }
        const data = await res.json();
        const first = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (first) {
          setPopupBanner(first);
          setShowPromoModal(true);
        } else {
          setPopupBanner({
            id: 'default',
            image: '/bichgiin.png',
            text: 'Хамгийн сүүлийн үеийн чанартай бичгийн цаас',
          });
          setShowPromoModal(true);
        }
      } catch {
        setPopupBanner({
          id: 'default',
          image: '/bichgiin.png',
          text: 'Хамгийн сүүлийн үеийн чанартай бичгийн цаас',
        });
        setShowPromoModal(true);
      }
    };

    loadPopupBanner();
  }, [isAuthenticated, isLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      <Hero />
      <FeaturedProducts />
      <DemandedProducts />
      <Partners />
      <Footer />

      {showPromoModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPromoModal(false)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <button
              type="button"
              onClick={() => setShowPromoModal(false)}
              className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 border border-gray-200"
              aria-label="Close promotion"
            >
              <X className="w-5 h-5" />
            </button>

            {popupBanner?.link ? (
              <a href={popupBanner.link} target="_blank" rel="noopener noreferrer">
                <img
                  src={popupBanner.image}
                  alt={popupBanner.text || 'Бичгийн цаасны сурталчилгаа'}
                  className="w-full h-auto object-cover"
                />
              </a>
            ) : (
              <img
                src={popupBanner?.image || '/bichgiin.png'}
                alt={popupBanner?.text || 'Бичгийн цаасны сурталчилгаа'}
                className="w-full h-auto object-cover"
              />
            )}
            <div className="p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {popupBanner?.text || 'Хамгийн сүүлийн үеийн чанартай бичгийн цаас'}
              </h2>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}