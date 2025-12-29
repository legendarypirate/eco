"use client";

import { useState } from 'react';
import { Category } from '../lib/types';

interface ExpandableCategorySidebarProps {
  categories?: Category[];
}

// Move defaultCategories outside the component, before it's used
const defaultCategories: Category[] = [
  {
    id: '1',
    name: 'Kids Accessories',
    nameMn: 'Аксессуар',
    image: '/images/accessories.jpg',
    description: 'Children accessories',
    productCount: 45,
    subcategories: [
      { id: '1-1', name: 'Kids', nameMn: 'Хүүхэд' },
      { id: '1-2', name: 'Travel', nameMn: 'Аялал' },
      { id: '1-3', name: 'Sports', nameMn: 'Спорт' },
      { id: '1-4', name: 'Accessories', nameMn: 'Аксессуар' },
    ]
  },
  {
    id: '2',
    name: 'Men Accessories',
    nameMn: 'Аксессуар',
    image: '/images/men-accessories.jpg',
    description: 'Men accessories collection',
    productCount: 89,
    subcategories: [
      { id: '2-1', name: 'Hats & Scarves', nameMn: 'Малгай, Ороолт' },
      { id: '2-2', name: 'Bags', nameMn: 'Цүнх' },
      { id: '2-3', name: 'Socks', nameMn: 'Оймс' },
      { id: '2-4', name: 'Gloves & Wristbands', nameMn: 'Бээлий, Кист' },
      { id: '2-5', name: 'Belts & Wallets', nameMn: 'Тээлэг, Түрийвч' },
      { id: '2-6', name: 'Walking & Travel Gear', nameMn: 'Алхалт, Аялалын хэрэгсэл' },
      { id: '2-7', name: 'Care Products', nameMn: 'Арчилгааны бүтээгдэхүүн' },
      { id: '2-8', name: 'Goggle Equipment', nameMn: 'Гоглын хэрэгсэл' },
    ]
  },
  {
    id: '3',
    name: 'Shoes',
    nameMn: 'Гутал',
    image: '/images/shoes.jpg',
    description: 'Footwear collection',
    productCount: 67,
    subcategories: [
      { id: '3-1', name: 'Sneakers & Keds', nameMn: 'Пүүз, Кед' },
      { id: '3-2', name: 'Winter Shoes', nameMn: 'Өвлийн гутал' },
      { id: '3-3', name: 'Spring/Autumn', nameMn: 'Хавар/Намрын' },
      { id: '3-4', name: 'Walking & Travel Shoes', nameMn: 'Алхалт, Аялалын гутал' },
      { id: '3-5', name: 'Sandals & Slippers', nameMn: 'Сандаль, Ултай, Таавч' },
    ]
  },
  {
    id: '4',
    name: 'Clothing',
    nameMn: 'Хувцас',
    image: '/images/clothing.jpg',
    description: 'Clothing collection',
    productCount: 124,
    subcategories: [
      { id: '4-1', name: 'Shirts', nameMn: 'Цамц' },
      { id: '4-2', name: 'Suits', nameMn: 'Хүрэм' },
      { id: '4-3', name: 'Outerwear', nameMn: 'Гадуур хувцас' },
      { id: '4-4', name: 'T-shirts & Tops', nameMn: 'Футболк, Майка' },
    ]
  }
];

const ExpandableCategorySidebar: React.FC<ExpandableCategorySidebarProps> = ({ 
  categories = defaultCategories 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('');

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
    setActiveCategory(categoryId);
  };

  const handleViewAll = (categoryName: string) => {
    console.log('View all:', categoryName);
    // Navigate to category page or show all products
  };

  const handleSubcategoryClick = (subcategoryName: string) => {
    console.log('Subcategory clicked:', subcategoryName);
    // Handle subcategory click
  };

  return (
    <div className="w-80 bg-white rounded-2xl shadow-modern border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <h2 className="text-2xl font-bold text-white text-center">
          Эрэгтэй
        </h2>
      </div>

      {/* Categories List */}
      <div className="py-4">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const isActive = activeCategory === category.id;

          return (
            <div key={category.id} className="border-b border-gray-100 last:border-b-0">
              {/* Main Category Button */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left transition-all duration-200 ${
                  isActive ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Category Icon */}
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-purple-500' : 'bg-gray-400'
                  }`} />
                  
                  <span className={`font-semibold text-lg ${
                    isActive ? 'text-purple-700' : 'text-gray-800'
                  }`}>
                    {category.nameMn}
                  </span>
                </div>

                {/* Expand/Collapse Icon */}
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Subcategories */}
              {isExpanded && category.subcategories && (
                <div className="bg-gray-50 border-t border-gray-100">
                  <div className="py-3">
                    {category.subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        onClick={() => handleSubcategoryClick(subcategory.nameMn)}
                        className="w-full px-12 py-3 text-left text-gray-700 hover:text-purple-600 hover:bg-white transition-colors duration-200 flex items-center space-x-3 group"
                      >
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full group-hover:bg-purple-500 transition-colors duration-200" />
                        <span className="text-sm font-medium">{subcategory.nameMn}</span>
                      </button>
                    ))}
                    
                    {/* View All Button */}
                    <div className="px-12 pt-2 pb-3">
                      <button
                        onClick={() => handleViewAll(category.nameMn)}
                        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors duration-200 group"
                      >
                        <span>Бүгдийг үзэх</span>
                        <svg 
                          className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">Хэрэгтэй зүйлсээ олоорой</p>
          <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-105 transition-all duration-200">
            Бүх Ангилал Үзэх
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpandableCategorySidebar;