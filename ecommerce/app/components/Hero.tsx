"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Banner {
  id: string;
  image: string;
  text?: string;
  link?: string;
}

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/banner/published`);
        
        // Handle 404 or other errors gracefully - use default banners
        if (!response.ok) {
          // Use default banners when API returns error (e.g., 404)
          setSlides([
            { id: '1', image: '/banner.jpg' },
            { id: '2', image: '/banner3.jpg' },
          ]);
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        // The API returns an array directly, not wrapped in data
        if (Array.isArray(data) && data.length > 0) {
          setSlides(data);
        } else {
          // Fallback to default banners if no banners found
          setSlides([
            { id: '1', image: '/banner.jpg' },
            { id: '2', image: '/banner3.jpg' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
        // Fallback to default banners on error
        setSlides([
          { id: '1', image: '/banner.jpg' },
          { id: '2', image: '/banner3.jpg' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-play slider
  useEffect(() => {
    if (slides.length <= 1 || loading) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides.length, loading]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  if (loading) {
    return (
      <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden bg-gray-200 animate-pulse">
        <div className="relative w-full h-full" />
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] overflow-hidden">
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const slideDiv = (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.text || `Hero slide ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
            </div>
          );

          // Wrap in link if banner has a link
          if (slide.link) {
            return (
              <a
                key={slide.id || index}
                href={slide.link}
                className="absolute inset-0 z-0"
                target="_blank"
                rel="noopener noreferrer"
              >
                {slideDiv}
              </a>
            );
          }

          return slideDiv;
        })}

        {/* Navigation Arrows - Only show if more than one slide */}
        {slides.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-300"
              aria-label="Previous slide"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all duration-300"
              aria-label="Next slide"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Dots Indicator - Only show if more than one slide */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-8 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;