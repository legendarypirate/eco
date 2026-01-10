"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X, ChevronDown, ChevronRight, Star, ShoppingCart, Sliders, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  nameMn?: string;
  price: string;
  originalPrice?: string;
  discount: string;
  rating: string;
  reviewCount: number;
  images: string[];
  thumbnail: string;
  category: string;
  categoryId?: string | null;
  brand?: string;
  inStock: boolean;
  stockQuantity: number;
  isFeatured: boolean;
  isNew: boolean;
  isOnSale: boolean;
  isBestSeller: boolean;
  isLimited: boolean;
  sales: number;
  slug: string;
  variations?: ProductVariation[];
  colorOptions?: ColorOption[];
  categories?: Category[];
}

interface ProductVariation {
  id: string;
  name: string;
  nameMn: string;
  price: string;
  originalPrice?: string;
  sku: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  attributes: Record<string, string>;
}

interface ColorOption {
  name: string;
  value: string;
  hex: string;
}

interface Category {
  id: string;
  name: string;
  nameMn: string | null;
  image: string;
  description: string | null;
  productCount: number;
  parentId: string | null;
  children?: Category[];
}

interface ApiResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  minPrice?: number;
  maxPrice?: number;
}

interface CategoriesResponse {
  flat: Category[];
  tree: Category[];
  total: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const ProductListPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryId = searchParams.get('category') || 'all';
  
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryId);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('default');
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [priceStats, setPriceStats] = useState<{ min: number; max: number }>({ min: 0, max: 5000000 });
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [priceRangeInitialized, setPriceRangeInitialized] = useState<boolean>(false);

  // Sync selectedCategory with URL params when URL changes
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'all';
    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [searchParams, selectedCategory]);

  // Fetch categories only once on mount
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products when filters change (but wait for categories to load first)
  useEffect(() => {
    // Don't fetch if categories haven't loaded yet (unless it's a category change)
    if (categories.length === 0 && selectedCategory !== 'all') {
      return;
    }
    
    // Allow initial fetch to proceed - price range will be updated after API response
    // This fixes the deadlock where products never load on initial page visit
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, priceRange, selectedBrands, sortBy, categories.length]);

  useEffect(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (priceRange[0] > priceStats.min || priceRange[1] < priceStats.max) count++;
    if (selectedBrands.length > 0) count++;
    setActiveFilters(count);
  }, [selectedCategory, priceRange, selectedBrands, priceStats]);

  useEffect(() => {
    if (selectedCategory !== 'all' && categories.length > 0) {
      expandParentCategories(selectedCategory, categories);
    }
  }, [selectedCategory, categories]);

  const expandParentCategories = (categoryId: string, allCategories: Category[]) => {
    const newExpanded = new Set(expandedCategories);
    
    const findAndExpandParents = (id: string, cats: Category[], parentId?: string): boolean => {
      for (const cat of cats) {
        if (cat.id === id) {
          if (parentId) {
            newExpanded.add(parentId);
          }
          return true;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findAndExpandParents(id, cat.children, cat.id);
          if (found) {
            if (parentId) {
              newExpanded.add(parentId);
            }
            return true;
          }
        }
      }
      return false;
    };

    findAndExpandParents(categoryId, allCategories);
    setExpandedCategories(newExpanded);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories?tree=true`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data: CategoriesResponse = await response.json();
      setCategories(data.tree || []);
      
      const initialExpanded = new Set<string>();
      data.tree?.forEach(cat => {
        if (cat.children && cat.children.length > 0) {
          initialExpanded.add(cat.id);
        }
      });
      setExpandedCategories(initialExpanded);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Ангилалын мэдээлэл авахад алдаа гарлаа');
    }
  };

  const fetchProducts = async (pageNum: number = 1, reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      let url = `${API_URL}/products?page=${pageNum}&limit=12`;
      
      if (selectedCategory !== 'all') {
        const category = findCategoryById(selectedCategory, categories);
        if (category) {
          // Send categoryId instead of category name for better filtering
          url += `&categoryId=${encodeURIComponent(category.id)}`;
        }
      }
      
      url += `&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}`;
      
      if (selectedBrands.length > 0) {
        url += `&brand=${selectedBrands.map(encodeURIComponent).join(',')}`;
      }
      
      switch (sortBy) {
        case 'price-low':
          url += '&sortBy=price_asc';
          break;
        case 'price-high':
          url += '&sortBy=price_desc';
          break;
        case 'rating':
          url += '&sortBy=rating';
          break;
        case 'discount':
          url += '&sortBy=discount';
          break;
        default:
          url += '&sortBy=createdAt';
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data: ApiResponse = await response.json();
      
      if (reset) {
        setProducts(data.products || []);
      } else {
        setProducts(prev => [...prev, ...(data.products || [])]);
      }
      
      setTotalProducts(data.total || 0);
      setHasMore(data.page < data.totalPages);
      
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        const newPriceStats = { min: data.minPrice, max: data.maxPrice };
        // Only update if values actually changed to prevent unnecessary re-renders
        setPriceStats(prev => {
          if (prev.min === newPriceStats.min && prev.max === newPriceStats.max) {
            return prev;
          }
          return newPriceStats;
        });
        
        // Only update priceRange on initial load if it's still at default values
        if (reset && !priceRangeInitialized && priceRange[0] === 0 && priceRange[1] === 5000000) {
          // Mark as initialized first to prevent useEffect from running
          setPriceRangeInitialized(true);
          setIsInitialLoad(false);
          // Only update if the new range is different from current
          if (data.minPrice !== priceRange[0] || data.maxPrice !== priceRange[1]) {
            setPriceRange([data.minPrice, data.maxPrice]);
          }
        } else if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
      
      const uniqueBrands = (data.products || [])
        .filter(p => p.brand && p.brand.trim())
        .map(p => p.brand as string);

      setBrands(prev => {
        const combined = [...prev, ...uniqueBrands];
        const newBrands = combined.filter((brand, index, self) => 
          self.indexOf(brand) === index
        );
        return newBrands.sort();
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Бүтээгдэхүүний мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const findCategoryById = (id: string, cats: Category[]): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryById(id, cat.children);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleCategoryExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(searchParams.toString());
    categoryId === 'all' ? params.delete('category') : params.set('category', categoryId);
    router.push(`/product?${params.toString()}`, { scroll: false });
    
    if (categoryId !== 'all') {
      expandParentCategories(categoryId, categories);
    }
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0₮';
    return new Intl.NumberFormat('mn-MN').format(numPrice) + '₮';
  };

  const calculateDiscount = (price: string, originalPrice?: string): number => {
    if (!originalPrice) return 0;
    const priceNum = parseFloat(price);
    const originalNum = parseFloat(originalPrice);
    if (isNaN(priceNum) || isNaN(originalNum) || originalNum <= priceNum) return 0;
    return Math.round(((originalNum - priceNum) / originalNum) * 100);
  };

  const getCategoryDisplayName = (category: Category | null | undefined): string => {
    if (!category) return 'Unknown';
    return category.nameMn || category.name || 'Unknown';
  };

  const currentCategory = selectedCategory !== 'all' 
    ? categories.find(c => c.id === selectedCategory)
    : null;

  const clearAllFilters = () => {
    handleCategoryChange('all');
    setPriceRange([priceStats.min, priceStats.max]);
    setSelectedBrands([]);
  };

  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    if (!categories || categories.length === 0) return null;
    
    return categories.map(category => {
      if (!category) return null;
      
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);
      const isSelected = selectedCategory === category.id;
      // Backend already calculates productCount including children, so use it directly
      const totalCount = category.productCount || 0;
      
      return (
        <div key={category.id} className="w-full">
          <div 
            className={`w-full flex justify-between items-center px-2 py-1.5 rounded text-sm ${
              isSelected
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            <div className="flex items-center flex-1 min-w-0">
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategoryExpand(category.id);
                  }}
                  className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 mr-1 flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              ) : (
                <div className="w-4 mr-1 flex-shrink-0"></div>
              )}
              
              <button
                onClick={() => handleCategoryChange(category.id)}
                className="text-left truncate flex-1 min-w-0"
                title={getCategoryDisplayName(category)}
              >
                {getCategoryDisplayName(category)}
              </button>
            </div>
            
            {totalCount > 0 && (
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {totalCount}
              </span>
            )}
          </div>
          
          {hasChildren && isExpanded && (
            <div className="w-full">
              {renderCategoryTree(category.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleProductClick = (product: Product) => {
    if (!product?.id || product.id === 'NaN' || product.id === 'undefined' || product.id === 'null') {
      console.error('Invalid product ID:', product?.id);
      return;
    }
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;
    
    const displayName = product.nameMn || product.name || 'Бүтээгдэхүүн';
    alert(`${displayName} сагсанд нэмэгдлээ!`);
  };

  const toggleExpandAll = () => {
    if (!categories || categories.length === 0) return;
    
    if (expandedCategories.size === categories.length) {
      setExpandedCategories(new Set());
    } else {
      const allCategoryIds = new Set<string>();
      const collectAllIds = (cats: Category[]) => {
        cats.forEach(cat => {
          allCategoryIds.add(cat.id);
          if (cat.children && cat.children.length > 0) {
            collectAllIds(cat.children);
          }
        });
      };
      collectAllIds(categories);
      setExpandedCategories(allCategoryIds);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-6 pt-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm">Бүтээгдэхүүний мэдээлэл уншиж байна...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-3 sm:px-4 py-6">
        {/* Page Header */}
        <div className="mb-6 pt-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {selectedCategory === 'all' ? 'Бүх бүтээгдэхүүн' : getCategoryDisplayName(currentCategory)}
          </h1>
          <p className="text-sm text-gray-500">
            {totalProducts} бүтээгдэхүүн
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Desktop Filters */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Ангилал</h3>
                <div className="flex items-center gap-2">
                  {activeFilters > 0 && (
                    <button 
                      onClick={clearAllFilters}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Цэвэрлэх
                    </button>
                  )}
                  <button
                    onClick={toggleExpandAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    title={expandedCategories.size === categories.length ? "Бүгдийг хаах" : "Бүгдийг дэлгэх"}
                  >
                    {expandedCategories.size === categories.length ? "Хаах" : "Дэлгэх"}
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 mb-5 max-h-[300px] overflow-y-auto pr-1">
                {/* All Categories button */}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full flex justify-between items-center px-2 py-1.5 rounded text-sm ${
                    selectedCategory === 'all'
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>Бүх бүтээгдэхүүн</span>
                  <span className="text-xs text-gray-500">{totalProducts}</span>
                </button>
                
                {/* Category tree */}
                {renderCategoryTree(categories)}
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Үнэ</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{formatPrice(priceStats.min)}</span>
                    <span className="text-gray-600">{formatPrice(priceStats.max)}</span>
                  </div>
                  <div className="relative h-1">
                    <div className="absolute w-full h-full bg-gray-200 rounded-full"></div>
                    <div 
                      className="absolute h-full bg-blue-600 rounded-full"
                      style={{
                        left: `${((priceRange[0] - priceStats.min) / (priceStats.max - priceStats.min)) * 100}%`,
                        right: `${100 - ((priceRange[1] - priceStats.min) / (priceStats.max - priceStats.min)) * 100}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min={priceStats.min}
                      max={priceStats.max}
                      step={Math.max(1, Math.round(priceStats.max / 1000))}
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                    <input
                      type="range"
                      min={priceStats.min}
                      max={priceStats.max}
                      step={Math.max(1, Math.round(priceStats.max / 1000))}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="absolute w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="text-xs text-gray-700 font-medium text-center">
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </div>
                </div>
              </div>

              {brands.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Брэнд</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 truncate">
                          {brand}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Controls Bar */}
            <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-300"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Шүүлтүүр
                  {activeFilters > 0 && (
                    <span className="ml-1 w-5 h-5 text-xs bg-blue-600 text-white rounded-full flex items-center justify-center">
                      {activeFilters}
                    </span>
                  )}
                </button>
                {activeFilters > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Бүгдийг цэвэрлэх
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white text-sm border rounded px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="default">Анхдагч</option>
                  <option value="price-low">Үнэ өсөх</option>
                  <option value="price-high">Үнэ буурах</option>
                  <option value="rating">Үнэлгээ өндөр</option>
                  <option value="discount">Хямдрал их</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500" />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Products Grid */}
            {(!products || products.length === 0) ? (
              <div className="text-center py-12">
                <div className="inline-flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Filter className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-sm mb-3">Хайлтад тохирох бүтээгдэхүүн олдсонгүй</p>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Шүүлтүүр цэвэрлэх
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map(product => {
                    if (!product) return null;
                    
                    const discount = calculateDiscount(product.price, product.originalPrice);
                    const displayName = product.nameMn || product.name || 'Бүтээгдэхүүн';
                    const displayBrand = product.brand || '';
                    const rating = parseFloat(product.rating) || 0;
                    const reviewCount = product.reviewCount || 0;
                    
                    return (
                      <div 
                        key={product.id} 
                        className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                          <img 
                            src={product.thumbnail || (product.images && product.images[0]) || '/default-product.jpg'} 
                            alt={displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-product.jpg';
                            }}
                          />
                          {discount > 0 && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                              -{discount}%
                            </div>
                          )}
                          {product.isFeatured && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                              Онцлох
                            </div>
                          )}
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded border">Дууссан</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-3">
                          {displayBrand && (
                            <div className="mb-1">
                              <span className="text-xs text-blue-600 font-medium">{displayBrand}</span>
                            </div>
                          )}
                          
                          <h3 className="text-sm text-gray-900 font-medium mb-1.5 line-clamp-2 h-10">
                            {displayName}
                          </h3>
                          
                          {rating > 0 && (
                            <div className="flex items-center mb-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(rating)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              {reviewCount > 0 && (
                                <span className="ml-1 text-xs text-gray-500">({reviewCount})</span>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-base font-bold text-gray-900">
                                {formatPrice(product.price)}
                              </span>
                              {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                                <span className="ml-1 text-xs text-gray-500 line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => handleAddToCart(product, e)}
                            disabled={!product.inStock}
                            className={`w-full py-2 text-sm rounded-md font-medium flex items-center justify-center gap-1.5 transition-colors ${
                              product.inStock
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {product.inStock ? 'Сагслах' : 'Дууссан'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load More */}
                {hasMore && (
                  <div className="text-center mt-8 pb-8">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-center gap-2 mx-auto"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Уншиж байна...
                        </>
                      ) : (
                        'Илүү их үзэх'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl animate-slideIn">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h2 className="font-semibold text-gray-900">Шүүлтүүр</h2>
                  <p className="text-xs text-gray-500">{products.length} бүтээгдэхүүн</p>
                </div>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1.5 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Ангилал</h3>
                    <button
                      onClick={toggleExpandAll}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {expandedCategories.size === categories.length ? "Хаах" : "Дэлгэх"}
                    </button>
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    <button
                      onClick={() => handleCategoryChange('all')}
                      className={`w-full flex justify-between items-center px-2 py-1.5 rounded text-sm ${
                        selectedCategory === 'all'
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>Бүх бүтээгдэхүүн</span>
                      <span className="text-xs text-gray-500">{totalProducts}</span>
                    </button>
                    {renderCategoryTree(categories)}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Үнэ</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">{formatPrice(priceStats.min)}</span>
                      <span className="text-gray-600">{formatPrice(priceStats.max)}</span>
                    </div>
                    <div className="relative h-1">
                      <div className="absolute w-full h-full bg-gray-200 rounded-full"></div>
                      <div 
                        className="absolute h-full bg-blue-600 rounded-full"
                        style={{
                          left: `${((priceRange[0] - priceStats.min) / (priceStats.max - priceStats.min)) * 100}%`,
                          right: `${100 - ((priceRange[1] - priceStats.min) / (priceStats.max - priceStats.min)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-700 font-medium text-center">
                      {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                    </div>
                  </div>
                </div>

                {brands.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Брэнд</h3>
                    <div className="space-y-1.5">
                      {brands.map(brand => (
                        <label key={brand} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => handleBrandToggle(brand)}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700 truncate">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  Харах ({products.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Mark page as dynamic since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function ProductListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-3 sm:px-4 py-6 pt-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm">Бүтээгдэхүүний мэдээлэл уншиж байна...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <ProductListPageContent />
    </Suspense>
  );
}