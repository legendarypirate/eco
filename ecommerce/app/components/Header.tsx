// app/components/Header.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Facebook, 
  Chrome,
  Heart,
  ShoppingCart,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  CreditCard,
  Bell,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Category as ApiCategory } from '../lib/types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface Category {
  id: string;
  name: string;
  image: string;
  parentId: string | null | undefined;
}

interface ApiResponse {
  flat: ApiCategory[];
  tree: any[];
  total: number;
}

const Header = () => {
  const router = useRouter();
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated, login, loginWithGoogle, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();

  // Login modal states
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Categories data
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get correct image URL
  const getImageUrl = (imagePath: string) => {
    if (!imagePath || imagePath === "default-category.jpg") {
      return null;
    }
    
    if (imagePath.startsWith('blob:')) {
      return null;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Get base URL without /api for asset paths
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    if (imagePath.startsWith('/assets')) {
      return `${baseUrl}${imagePath}`;
    }
    
    return `${baseUrl}/assets/category/${imagePath}`;
  };

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/categories`);
        const data: ApiResponse = await response.json();

        const parentCategories = data.flat.filter(
          (category: ApiCategory) => category.parentId === null
        );

        // Sort by order field, then by name
        parentCategories.sort((a: ApiCategory, b: ApiCategory) => {
          const aOrder = (a as any).order;
          const bOrder = (b as any).order;
          
          if (aOrder !== null && aOrder !== undefined && bOrder !== null && bOrder !== undefined) {
            return aOrder - bOrder;
          }
          if (aOrder !== null && aOrder !== undefined) return -1;
          if (bOrder !== null && bOrder !== undefined) return 1;
          return a.name.localeCompare(b.name);
        });

        const transformedCategories: Category[] = parentCategories.map(
          (category: ApiCategory) => ({
            id: category.id,
            name: category.name,
            image: category.image,
            parentId: category.parentId,
          })
        );

        setCategories(transformedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for Google auth success from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'google_auth_success') {
        console.log('Google auth success received:', event.data);
        setIsLoginOpen(false);
        setIsGoogleLoading(false);
      } else if (event.data.type === 'google_auth_error') {
        setLoginError(event.data.message || 'Google нэвтрэхэд алдаа гарлаа');
        setIsGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    router.push(`/product?category=${categoryId}`);
  };

  const handleAllCategoriesClick = () => {
    setActiveCategory('');
    router.push('/product');
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/product?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // User button click handler
  const handleUserButtonClick = () => {
    if (isAuthenticated) {
      setIsUserMenuOpen(!isUserMenuOpen);
    } else {
      setIsLoginOpen(true);
      setIsUserMenuOpen(false);
    }
  };

  // Handle login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    
    try {
      // Check if input is email or phone number
      const credentials: any = { password };
      
      // Check if input looks like email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        credentials.email = email;
      } else {
        // Assume it's a phone number (Mongolian format)
        credentials.phone = email;
      }
      
      await login(credentials);
      setIsLoginOpen(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setLoginError(error.message || 'Нэвтрэхэд алдаа гарлаа. Та имэйл/утас болон нууц үгээ шалгана уу.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setLoginError(null);
    
    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        setIsLoginOpen(false);
      } else {
        setLoginError('Google нэвтрэхэд алдаа гарлаа');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setLoginError(error.message || 'Google нэвтрэхэд алдаа гарлаа');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  // Handle register button
  const handleRegisterClick = () => {
    setIsLoginOpen(false);
    router.push('/register');
  };

  // Render category image or fallback
  const renderCategoryImage = (category: Category, size: 'small' | 'medium' = 'small') => {
    const imageUrl = getImageUrl(category.image);
    const sizeClass = size === 'small' ? 'w-6 h-6' : 'w-8 h-8';
    
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={category.name}
          className={`${sizeClass} object-cover rounded-full border border-gray-200`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    return (
      <div className={`${sizeClass} rounded-full bg-gray-200 flex items-center justify-center`}>
        <span className={`${size === 'small' ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
          {category.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className={`bg-white sticky top-0 z-50 transition-shadow duration-200 ${scrolled ? 'shadow-md border-b border-gray-100' : ''}`}>
        {/* Top Row */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => router.push('/')}
                  className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="/logotsas.png" 
                    alt="Tsaas.mn Logo" 
                    className="w-8 h-8 rounded-lg object-cover shadow-sm"
                  />
                  <div className="text-base font-bold text-gray-900">
                    Tsaas.mn
                  </div>
                </button>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-4">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Бараа хайх..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Action Icons */}
              <div className="flex items-center space-x-4">
                {/* Notifications (Optional) */}
               

                {/* Wishlist */}
                <button 
                  onClick={() => router.push('/wishlist')}
                  className="relative text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={handleUserButtonClick}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
                  >
                    <div className="relative">
                      {isAuthenticated ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                          {getUserInitials()}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      {isAuthenticated && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    {isAuthenticated && (
                      <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && isAuthenticated && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg rounded-lg z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user?.full_name || user?.email || user?.phone}</p>
                            {user?.provider === 'google' && (
                              <div className="flex items-center gap-1">
                                <Chrome className="w-3 h-3 text-red-500" />
                                <span className="text-xs text-gray-500">Google хаяг</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            router.push('/account');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Миний профайл</span>
                        </button>
                        <button
                          onClick={() => {
                            router.push('/orders');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span>Миний захиалгууд</span>
                        </button>
                        <button
                          disabled
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed rounded-lg opacity-60"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Төлбөрийн хэрэгсэл</span>
                        </button>
                        <button
                          disabled
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed rounded-lg opacity-60"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Тохиргоо</span>
                        </button>
                        <div className="border-t border-gray-100 my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Гарах</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart */}
                <button 
                  onClick={() => router.push('/cart')}
                  className="relative text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full text-[10px] text-white flex items-center justify-center animate-bounce">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Bar */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-12" ref={dropdownRef}>
              {/* All Categories Button */}
              <div className="relative">
                <button
                  onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-black text-white text-sm rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-200 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>Бүх Ангилал</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Category Dropdown */}
                {isCategoryMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 shadow-xl rounded-xl z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Ангилал</h3>
                      {isLoadingCategories ? (
                        <div className="py-8 text-center">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                          <p className="mt-2 text-sm text-gray-500">Ангилал ачаалж байна...</p>
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                          <button
                            onClick={() => {
                              handleAllCategoriesClick();
                              setIsCategoryMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center group-hover:from-gray-300 group-hover:to-gray-400 transition-all">
                              <span className="text-sm font-medium">📦</span>
                            </div>
                            <span className="font-medium">Бүх бараа</span>
                            <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => {
                                handleCategoryClick(category.id);
                                setIsCategoryMenuOpen(false);
                              }}
                              className="w-full flex items-center space-x-3 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                              {renderCategoryImage(category, 'medium')}
                              <span className="font-medium">{category.name}</span>
                              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <button 
                          className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 font-medium py-2 hover:bg-gray-50 rounded-lg transition-colors"
                          onClick={() => setIsCategoryMenuOpen(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Хаах
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Horizontal Categories */}
              <div className="flex items-center space-x-1 ml-4 flex-1 overflow-x-auto py-1 scrollbar-hide">
                {isLoadingCategories ? (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAllCategoriesClick}
                      className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg transition-all ${
                        activeCategory === ''
                          ? 'text-gray-900 font-medium bg-gradient-to-r from-gray-100 to-gray-50 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-[10px] font-medium">📦</span>
                      </div>
                      <span className="text-[10px] font-medium truncate max-w-[180px]">
                        Бүгд
                      </span>
                    </button>
                    {categories.slice(0, 6).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-lg transition-all ${
                          activeCategory === category.id
                            ? 'text-gray-900 font-medium bg-gradient-to-r from-gray-100 to-gray-50 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {renderCategoryImage(category, 'small')}
                        <span className="text-[10px] font-medium truncate max-w-[180px]">
                          {category.name}
                        </span>
                      </button>
                    ))}
                    {categories.length > 6 && (
                      <button
                        onClick={() => setIsCategoryMenuOpen(true)}
                        className="flex items-center gap-2 whitespace-nowrap px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg"
                      >
                        <span className="text-[10px] font-medium">...</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          .animate-bounce {
            animation: bounce 1s infinite;
          }
        `}</style>
      </header>

      {/* Login Modal */}
      {isLoginOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
            onClick={() => setIsLoginOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsLoginOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Нэвтрэх</h2>
                  <p className="text-sm text-gray-600">Тавтай морилно уу</p>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600">{loginError}</p>
                    </div>
                  </div>
                )}

                {/* Google Login Button */}
                <div className="mb-6">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGoogleLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-700 font-medium">
                          Google нэвтэрч байна...
                        </span>
                      </>
                    ) : (
                      <>
                        <Chrome className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-gray-700 font-medium">
                          Google хаягаар нэвтрэх
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-500">Эсвэл имэйл/утас</span>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Имэйл хаяг эсвэл утасны дугаар
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 text-sm transition-all"
                        placeholder="имэйл@жишээ.com эсвэл 99112233"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-700">
                        Нууц үг
                      </label>
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Нууц үгээ мартсан уу?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 text-sm transition-all"
                        placeholder="Нууц үгээ оруулна уу"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-gray-900 to-black text-white text-sm font-medium rounded-lg hover:from-gray-800 hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98] shadow-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Нэвтэрч байна...
                      </span>
                    ) : (
                      'Нэвтрэх'
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Шинэ хэрэглэгч үү?{' '}
                    <button
                      onClick={handleRegisterClick}
                      className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                    >
                      Бүртгүүлэх
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Add missing ChevronRight component
const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default Header;