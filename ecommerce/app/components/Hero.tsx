"use client";

import { useState } from 'react';

const Hero = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const categories = [
    { name: 'Ветровка', icon: '🧥' },
    { name: 'Дождевики', icon: '🌧️' },
    { name: 'Куртки', icon: '🧥' },
    { name: 'Флиски', icon: '🧶' },
    { name: 'Термобелье', icon: '🔥' },
  ];

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Subtle Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-blue-900/5 to-gray-900/20"></div>
      
      {/* Minimal Geometric Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-screen blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mix-blend-screen blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Side - Minimal Categories Card */}
          <div className="lg:col-span-4">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
              <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-white/10">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">M</span>
                </div>
                <h3 className="text-base font-semibold tracking-wide">mont-bell</h3>
              </div>
              
              <div className="space-y-1.5">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCategory(category.name)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                      activeCategory === category.name
                        ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{category.icon}</span>
                      <span className="text-sm font-medium text-white/90">{category.name}</span>
                    </div>
                    <svg 
                      className={`w-4 h-4 transition-all duration-200 ${
                        activeCategory === category.name 
                          ? 'opacity-100 translate-x-0' 
                          : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Minimal Main Content */}
          <div className="lg:col-span-8">
            <div className="text-center lg:text-left">
              {/* Minimal Badge */}
              <div className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-full font-semibold text-xs mb-4">
                <span className="mr-1">🆕</span>
                <span>NEW ARRIVALS</span>
              </div>
              
              {/* Main Headline - Smaller */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                ШИНЭ
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  ӨВЛИЙН КОЛЛЕКЦ
                </span>
              </h1>
              
              {/* Description - Smaller */}
              <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed max-w-2xl">
                mont-bell брэндийн дэлхийн стандартад нийцсэн өвлийн коллекц.
              </p>

              {/* Minimal CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
                <button className="group bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300 shadow-md">
                  <span className="flex items-center justify-center space-x-2">
                    <span>🛍️ Дэлгэрэнгүй үзэх</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
                
                <button className="border border-white/30 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all duration-300">
                  👀 Бүгдийг харах
                </button>
              </div>

              {/* Minimal Sale Banner */}
              <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-red-600/80 via-pink-600/80 to-purple-600/80 backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start space-x-1.5 mb-1">
                        <span className="text-lg">🎄</span>
                        <h3 className="text-base sm:text-lg font-bold">HOLIDAY SALE</h3>
                        <span className="text-lg">🎅</span>
                      </div>
                      <p className="text-xs sm:text-sm opacity-95">БҮХ БАРААНД ХЯМДРАЛ</p>
                    </div>
                    
                    <div className="flex items-center space-x-1.5">
                      {[20, 30, 50].map((discount, index) => (
                        <div
                          key={index}
                          className="bg-white text-red-600 px-2.5 py-1.5 rounded-lg font-bold text-sm shadow-sm hover:scale-105 transition-transform duration-200"
                        >
                          {discount}%
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Minimal Timer */}
                  <div className="mt-4 pt-3 border-t border-white/20">
                    <div className="flex items-center justify-center space-x-2 text-xs">
                      <span className="font-medium">⏰ Хязгаарлагдмал:</span>
                      <div className="flex items-center space-x-1 font-mono">
                        <span className="bg-white/10 px-2 py-0.5 rounded">23</span>
                        <span>:</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded">45</span>
                        <span>:</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded">12</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center">
            <div className="w-0.5 h-2 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;