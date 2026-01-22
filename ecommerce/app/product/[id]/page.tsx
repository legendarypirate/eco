// app/product/[id]/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Heart, ShoppingCart, Share2, Truck, Shield, RotateCcw, ChevronLeft, ZoomIn, X, ArrowLeft, Check, MessageSquare } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Product, ColorOption } from '../../lib/types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    hoverRating: 0
  });
  const [infoImages, setInfoImages] = useState<string[]>([]);
  const [loadingInfoImages, setLoadingInfoImages] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  
  // Size and color selection states
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  
  // Loading states
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  // Custom cursor position
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });

  // Get cart and wishlist from context
  const { 
    addToCart, 
    addToWishlist, 
    removeFromWishlist,
    wishlistItems 
  } = useCart();

  // Get auth from context
  const { user, isAuthenticated } = useAuth();

  // Validate product ID
  const isValidId = (id: string | string[] | undefined): boolean => {
    if (!id) return false;
    const idStr = Array.isArray(id) ? id[0] : id;
    if (!idStr || idStr === 'NaN' || idStr === 'undefined' || idStr === 'null' || idStr.trim() === '') {
      return false;
    }
    return true;
  };

  // Fetch product data
  useEffect(() => {
    if (!isValidId(params.id)) {
      console.error('Invalid product ID:', params.id);
      router.push('/product');
      return;
    }
    
    if (params.id) {
      fetchProductData();
      fetchReviews();
      fetchInfoImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Fetch reviews for the product
  const fetchReviews = async () => {
    if (!isValidId(params.id)) return;
    
    try {
      setLoadingReviews(true);
      const response = await fetch(`${API_URL}/reviews/product/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch info images for the product
  const fetchInfoImages = async () => {
    if (!isValidId(params.id)) return;
    
    try {
      setLoadingInfoImages(true);
      const response = await fetch(`${API_URL}/product-info-images/product/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInfoImages(data.map((img: any) => img.imageUrl) || []);
      }
    } catch (error) {
      console.error('Error fetching info images:', error);
    } finally {
      setLoadingInfoImages(false);
    }
  };

  // Check if product is in wishlist whenever wishlistItems changes
  useEffect(() => {
    if (product && wishlistItems) {
      // Compare IDs as strings (UUIDs)
      const isProductInWishlist = wishlistItems.some(item => 
        String(item.id) === String(product.id)
      );
      setIsLiked(isProductInWishlist);
    }
  }, [product, wishlistItems]);

  // When product loads, select first available variation
  useEffect(() => {
    if (product?.variations && product.variations.length > 0) {
      const firstAvailableVariation = product.variations.find(v => v.inStock) || product.variations[0];
      if (firstAvailableVariation) {
        handleVariationSelection(firstAvailableVariation);
      }
    }
  }, [product]);

  const fetchProductData = async () => {
    if (!isValidId(params.id)) {
      console.error('Cannot fetch product with invalid ID:', params.id);
      router.push('/product');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch product details
      const productResponse = await fetch(`${API_URL}/products/${params.id}`);
      if (!productResponse.ok) {
        if (productResponse.status === 404) {
          router.push('/product');
          return;
        }
        throw new Error('Product not found');
      }
      const productData = await productResponse.json();
      setProduct(productData);

      // Fetch related products (from same category)
      const categoryParam = productData.categoryId || productData.category;
      const relatedUrl = categoryParam
        ? productData.categoryId
          ? `${API_URL}/products?categoryId=${categoryParam}&limit=4`
          : `${API_URL}/products?category=${encodeURIComponent(categoryParam)}&limit=4`
        : `${API_URL}/products?limit=4`;

      const relatedResponse = await fetch(relatedUrl);
      const relatedData = await relatedResponse.json();
      const relatedList = Array.isArray(relatedData)
        ? relatedData
        : relatedData.products || [];

      const filtered = relatedList.filter((item: Product) => String(item.id) !== String(productData.id));
      setRelatedProducts(filtered.slice(0, 4));
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle wishlist toggle
const handleWishlistToggle = async () => {
  if (!product) return;
  
  setAddingToWishlist(true);
  
  try {
    // Keep product.id as string (UUID)
    const productId = String(product.id);
    
    if (isLiked) {
      // Remove from wishlist - passing UUID string
      removeFromWishlist(productId);
      setIsLiked(false);
      showToast('Бүтээгдэхүүн хүсэлтийн жагсаалтаас хасагдлаа', 'success');
    } else {
      // Add to wishlist
      addToWishlist({
        id: productId, // UUID string
        product: {
          id: productId,
          name: product.name,
          nameMn: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.images?.[0] || '',
          thumbnail: product.thumbnail || product.images?.[0] || '',
          category: product.category || '',
          inStock: product.inStock || true
        },
        addedAt: new Date().toISOString()
      });
      setIsLiked(true);
      showToast('Бүтээгдэхүүн хүсэлтийн жагсаалтанд нэмэгдлээ', 'success');
    }
  } catch (error) {
    console.error('Error updating wishlist:', error);
    showToast('Алдаа гарлаа. Дахин оролдоно уу.', 'error');
  } finally {
    setAddingToWishlist(false);
  }
};
  // Handle add to cart
 // Product хуудасны handleAddToCart функцэд:

const handleAddToCart = async () => {
  if (!product) return;
  
  const currentInStock = getCurrentStockStatus();
  if (!currentInStock) {
    showToast('Энэ бүтээгдэхүүн дууссан байна', 'warning');
    return;
  }
  
  setAddingToCart(true);
  
  try {
    // Validate selection if product has variations
    if (product.variations && product.variations.length > 0) {
      if (!selectedVariation) {
        showToast('Хэмжээ эсвэл өнгийг сонгоно уу', 'warning');
        setAddingToCart(false);
        return;
      }
    }
    
    const currentPrice = getCurrentPrice();
    const currentOriginalPrice = getCurrentOriginalPrice();
    
    // Keep product.id as string (UUID)
    const productId = String(product.id);
    
    // Create CartItem object with UUID string ID
    const cartItem = {
      id: productId, // UUID string
      product: {
        id: productId, // UUID string
        name: product.name,
        nameMn:  product.name,
        price: currentPrice,
        originalPrice: currentOriginalPrice || undefined,
        image: product.images?.[0] || '',
        thumbnail: product.thumbnail || product.images?.[0] || '',
        category: product.category || '',
        inStock: currentInStock
      },
      quantity: quantity,
      selectedSize: selectedSize || 'M',
      selectedColor: selectedColor || 'Хар',
      addedAt: new Date().toISOString()
    };
    
    const result = addToCart(cartItem);
    
    if (result.alreadyExists) {
      showToast('энэ бараа сагсанд байна', 'warning');
    } else if (result.success) {
      showToast(`${quantity} ширхэг ${product.name} сагсанд нэмэгдлээ`, 'success');
      setQuantity(1);
    }
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Алдаа гарлаа. Дахин оролдоно уу.', 'error');
  } finally {
    setAddingToCart(false);
  }
};

  // Handle variation selection based on size and color
  const handleVariationSelection = (variation: any) => {
    setSelectedVariation(variation);
    if (variation.attributes) {
      if (variation.attributes.size) setSelectedSize(variation.attributes.size);
      if (variation.attributes.color) setSelectedColor(variation.attributes.color);
    }
    
    // Update images if variation has specific images
    if (variation.images && variation.images.length > 0) {
      setSelectedImage(0);
    }
  };

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    
    // Find variation with selected size and color (or just size if no color selected)
    if (product?.variations) {
      const variation = product.variations.find(v => 
        v.attributes.size === size && 
        (!selectedColor || v.attributes.color === selectedColor)
      );
      
      if (variation) {
        handleVariationSelection(variation);
      }
    }
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    
    // Find variation with selected color and size (or just color if no size selected)
    if (product?.variations) {
      const variation = product.variations.find(v => 
        v.attributes.color === color && 
        (!selectedSize || v.attributes.size === selectedSize)
      );
      
      if (variation) {
        handleVariationSelection(variation);
      }
    }
  };

  // Get current variation price
  const getCurrentPrice = () => {
    if (selectedVariation) {
      return selectedVariation.price;
    }
    return product?.price || 0;
  };

  // Get current variation original price
  const getCurrentOriginalPrice = () => {
    if (selectedVariation && selectedVariation.originalPrice) {
      return selectedVariation.originalPrice;
    }
    return product?.originalPrice;
  };

  // Get current variation stock status
  const getCurrentStockStatus = () => {
    if (selectedVariation) {
      return selectedVariation.inStock;
    }
    return product?.inStock || false;
  };

  // Get current variation stock quantity
  const getCurrentStockQuantity = () => {
    if (selectedVariation) {
      return selectedVariation.stockQuantity;
    }
    return product?.stockQuantity || 0;
  };

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!isAuthenticated || !user) {
      showToast('Үнэлгээ үлдээхийн тулд нэвтэрнэ үү', 'warning');
      return;
    }

    if (!reviewForm.rating || !reviewForm.comment.trim()) {
      showToast('Үнэлгээ болон сэтгэгдэл оруулна уу', 'warning');
      return;
    }

    if (!product) return;

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewForm.rating,
          title: reviewForm.title.trim() || undefined,
          comment: reviewForm.comment.trim(),
          userName: user.full_name
        })
      });

      if (response.ok) {
        const newReview = await response.json();
        setReviews([newReview, ...reviews]);
        setReviewForm({ rating: 0, title: '', comment: '', hoverRating: 0 });
        setShowReviewForm(false);
        showToast('Үнэлгээ амжилттай үлдээгдлээ', 'success');
        
        // Refresh product data to update rating
        fetchProductData();
      } else {
        const error = await response.json();
        showToast(error.message || 'Үнэлгээ үлдээхэд алдаа гарлаа', 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('Үнэлгээ үлдээхэд алдаа гарлаа', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-[100px] right-4 z-50 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${
      type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
      type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
      'bg-yellow-50 border border-yellow-200 text-yellow-800'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center">
        <div class="mr-3">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
        </div>
        <div class="font-medium">${message}</div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  // Handle mouse move for custom cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !product) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update cursor position
    setCursorPos({ x: e.clientX, y: e.clientY });
    
    // Only zoom if mouse is within image bounds
    const isWithinBounds = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    setIsZooming(isWithinBounds);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setCursorPos({ x: -100, y: -100 });
  };

  // Calculate zoom effect
  const getZoomStyle = () => {
    if (!isZooming || !imageRef.current || !product) return {};
    
    const rect = imageRef.current.getBoundingClientRect();
    const mouseX = cursorPos.x - rect.left;
    const mouseY = cursorPos.y - rect.top;
    
    // Calculate zoom position (center on mouse)
    const zoomX = (mouseX / rect.width) * 100;
    const zoomY = (mouseY / rect.height) * 100;
    
    return {
      transform: 'scale(2)',
      transformOrigin: `${zoomX}% ${zoomY}%`,
      transition: 'transform 0.1s ease-out',
    };
  };

  // Fullscreen zoom modal
  const openZoomModal = () => setShowZoomModal(true);
  const closeZoomModal = () => setShowZoomModal(false);

  // Keyboard shortcuts for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showZoomModal && e.key === 'Escape') {
        closeZoomModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showZoomModal]);

  // Hide cursor when not zooming
  useEffect(() => {
    if (!isZooming) {
      setCursorPos({ x: -100, y: -100 });
    }
  }, [isZooming]);

  // Get images to display (use variation images if available, otherwise product images)
  const getDisplayImages = () => {
    if (selectedVariation?.images && selectedVariation.images.length > 0) {
      return selectedVariation.images;
    }
    return product?.images && product.images.length > 0 
      ? product.images 
      : ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&h=1200&fit=crop'];
  };

  const images = getDisplayImages();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Бүтээгдэхүүн ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Бүтээгдэхүүн олдсонгүй</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Нүүр хуудас руу буцах
          </button>
        </div>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const currentOriginalPrice = getCurrentOriginalPrice();
  const currentInStock = getCurrentStockStatus();
  const currentStockQuantity = getCurrentStockQuantity();

  // Price formatting helper
  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center text-sm">
            <button 
              onClick={() => router.push('/')}
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <svg className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Нүүр</span>
            </button>
            
            <ChevronLeft className="w-4 h-4 mx-2 text-gray-400 rotate-180" />
            
            <span className="text-gray-700 font-medium px-2 py-0.5 rounded hover:bg-gray-100 transition-colors">
              {product.category}
            </span>
            
            <ChevronLeft className="w-4 h-4 mx-2 text-gray-400 rotate-180" />
            
            <span className="text-gray-900 font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Product Images with Simple Hover Zoom */}
            <div>
              <div className="mb-4">
                {/* Main Image Container with Hover Zoom */}
                <div className="relative">
                  <div 
                    ref={imageRef}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4 relative"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  >
                    <img 
                      src={images[selectedImage]} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-100"
                      style={getZoomStyle()}
                    />
                    
                    {/* Zoom Indicator Button */}
                    <button
                      onClick={openZoomModal}
                      className="absolute bottom-3 right-3 bg-black/70 hover:bg-black text-white rounded-full p-2 transition-colors"
                      aria-label="Зураг томруулах"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    
                    {/* Custom Zoom Cursor (only shown when zooming) */}
                    <div 
                      ref={cursorRef}
                      className={`fixed pointer-events-none z-50 transition-opacity duration-100 ${
                        isZooming ? 'opacity-100' : 'opacity-0'
                      }`}
                      style={{
                        left: `${cursorPos.x}px`,
                        top: `${cursorPos.y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Long narrow plus icon */}
                      <div className="relative">
                        <div className="absolute w-[2px] h-8 bg-white -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                        <div className="absolute w-8 h-[2px] bg-white -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Thumbnails */}
                  <div className="flex space-x-2">
                    {images.map((img: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`w-16 h-16 rounded border overflow-hidden flex-shrink-0 transition-all ${
                          selectedImage === idx 
                            ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  {product.brand ? (
                    <span className="text-sm font-medium text-gray-600">{product.brand}</span>
                  ) : (
                    <span></span>
                  )}
                  <button
                    onClick={handleWishlistToggle}
                    disabled={addingToWishlist}
                    className={`relative text-gray-400 hover:text-red-500 transition-colors ${
                      addingToWishlist ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {addingToWishlist ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    )}
                  </button>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({product.reviewCount || 0} үнэлгээ)</span>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(currentPrice)}₮
                    </span>
                    {currentOriginalPrice && parseFloat(currentOriginalPrice.toString()) > parseFloat(currentPrice.toString()) && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          {formatPrice(currentOriginalPrice)}₮
                        </span>
                        <span className="bg-red-100 text-red-700 text-sm font-bold px-2 py-0.5 rounded">
                          -{Math.round((1 - currentPrice / currentOriginalPrice) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                  {selectedVariation && (
                    <p className="text-sm text-green-600 mt-1">
                      Сонгосон хувилбар: {selectedVariation.nameMn || selectedVariation.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Тайлбар</h3>
                  <div 
                    className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}

              {/* Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Техникийн мэдээлэл</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="text-gray-500 w-32">{key}:</span>
                        <span className="text-gray-900 font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selection - Colored Radio Buttons */}
              {product.colorOptions && product.colorOptions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Өнгө</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.colorOptions.map((color: ColorOption) => {
                      const isSelected = selectedColor === color.name;
                      const isAvailable = product.variations?.some(v => 
                        v.attributes.color === color.name && v.inStock
                      );
                      
                      return (
                        <label
                          key={color.value}
                          className={`
                            relative w-12 h-12 rounded-full border-2 flex items-center justify-center
                            transition-all duration-200 transform hover:scale-105 cursor-pointer
                            ${isSelected 
                              ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20' 
                              : 'border-gray-300 hover:border-gray-400'
                            }
                            ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                          style={{ backgroundColor: color.value }}
                          title={`${color.name}${!isAvailable ? ' (Дууссан)' : ''}`}
                        >
                          <input
                            type="radio"
                            name="color-option"
                            value={color.name}
                            checked={isSelected}
                            onChange={() => handleColorSelect(color.name)}
                            disabled={!isAvailable}
                            className="sr-only"
                          />
                          
                          {/* Color swatch */}
                          <div 
                            className="w-10 h-10 rounded-full border border-gray-200"
                            style={{ backgroundColor: color.value }}
                          />
                          
                          {/* Radio button indicator for selected */}
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full border-2 border-gray-900 shadow-md"></div>
                            </div>
                          )}
                          
                          {/* Out of stock indicator */}
                          {!isAvailable && (
                            <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center">
                              <div className="w-8 h-px bg-gray-400 rotate-45"></div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Сонгосон өнгө: {selectedColor || 'Сонгоогүй'}
                  </div>
                </div>
              )}

              {/* Size Selection - Stylish Size Buttons */}
              {product.sizeOptions && product.sizeOptions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Хэмжээ</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizeOptions.map((size: string) => {
                      const isSelected = selectedSize === size;
                      const isAvailable = product.variations?.some(v => 
                        v.attributes.size === size && 
                        (!selectedColor || v.attributes.color === selectedColor) && 
                        v.inStock
                      );
                      
                      return (
                        <button
                          key={size}
                          onClick={() => handleSizeSelect(size)}
                          disabled={!isAvailable}
                          className={`
                            w-14 h-12 border rounded-lg text-sm font-medium transition-all duration-200
                            flex items-center justify-center relative
                            ${isSelected 
                              ? 'bg-gray-900 text-white border-gray-900' 
                              : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }
                            ${!isAvailable 
                              ? 'opacity-50 cursor-not-allowed text-gray-400 line-through' 
                              : 'cursor-pointer'
                            }
                          `}
                          title={`${size}${!isAvailable ? ' (Дууссан)' : ''}`}
                        >
                          {size}
                          
                          {/* Checkmark for selected */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Сонгосон хэмжээ: {selectedSize || 'Сонгоогүй'}
                  </div>
                </div>
              )}

              {/* Variations Quick Select */}
              {product.variations && product.variations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Боломжит хувилбарууд</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variations.slice(0, 6).map((variation: any) => {
                      const isSelected = selectedVariation?.id === variation.id;
                      const attributes = variation.attributes || {};
                      
                      return (
                        <button
                          key={variation.id}
                          onClick={() => handleVariationSelection(variation)}
                          disabled={!variation.inStock}
                          className={`
                            px-3 py-2 border rounded-lg text-xs font-medium transition-all duration-200
                            flex items-center gap-2
                            ${isSelected 
                              ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200' 
                              : variation.inStock
                                ? 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            }
                          `}
                        >
                          <span>{attributes.color || ''} {attributes.size ? `- ${attributes.size}` : ''}</span>
                          {!variation.inStock && (
                            <span className="text-red-500 text-xs">(Дууссан)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity & Actions */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-l-lg transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium border-x border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-r-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="flex-1">
                    <button 
                      onClick={handleAddToCart}
                      disabled={!currentInStock || addingToCart}
                      className={`
                        w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 
                        transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100
                        ${currentInStock 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      {addingToCart ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Нэмж байна...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>{currentInStock ? 'Сагслах' : 'Дууссан'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Stock Status */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <div className={`w-2 h-2 rounded-full mr-2 ${currentInStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {currentInStock ? (
                    <>
                      <span className="text-green-600 font-medium">Бэлэн байгаа</span>
                      {currentStockQuantity > 0 && (
                        <span className="ml-2 text-gray-500">({currentStockQuantity} ширхэг үлдсэн)</span>
                      )}
                    </>
                  ) : (
                    <span className="text-red-600">Дууссан</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center text-gray-600">
                    <Truck className="w-4 h-4 mr-2" />
                    <span>Үнэгүй хүргэлт</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    <span>14 хоног буцаах</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Shield className="w-4 h-4 mr-2" />
                    <span>2 жил гарант</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Share2 className="w-4 h-4 mr-2" />
                    <span>Хуваалцах</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Төстэй бараа</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((item: Product) => {
                if (!item.id || item.id === 'NaN' || item.id === 'undefined' || item.id === 'null') {
                  return null;
                }
                return (
                <div 
                  key={item.id} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors cursor-pointer hover:shadow-md"
                  onClick={() => router.push(`/product/${item.id}`)}
                >
                  <div className="aspect-square bg-gray-100">
                    <img 
                      src={item.thumbnail || (item.images && item.images[0]) || '/placeholder.jpg'} 
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{item.name}</h3>
                    <div className="text-base font-bold text-gray-900">
                      {formatPrice(item.price)}₮
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Images Section */}
        {infoImages.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Мэдээллийн зураг</h2>
            <div className="space-y-4">
              {infoImages.map((imageUrl, index) => (
                <div key={index} className="w-full">
                  <img
                    src={imageUrl}
                    alt={`Product info ${index + 1}`}
                    className="w-full h-auto rounded-lg object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Үнэлгээ ({reviews.length || product.reviewCount || 0})
            </h2>
            {isAuthenticated && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                Үнэлгээ үлдээх
              </button>
            )}
          </div>

          {/* Review Form */}
          {isAuthenticated && showReviewForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-bold text-gray-900">Үнэлгээ үлдээх</h3>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewForm({ rating: 0, title: '', comment: '', hoverRating: 0 });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Rating Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Үнэлгээ <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      onMouseEnter={() => setReviewForm({ ...reviewForm, hoverRating: star })}
                      onMouseLeave={() => setReviewForm({ ...reviewForm, hoverRating: 0 })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (reviewForm.hoverRating || reviewForm.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {reviewForm.rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600">
                      {reviewForm.rating === 1 && 'Маш муу'}
                      {reviewForm.rating === 2 && 'Муу'}
                      {reviewForm.rating === 3 && 'Дунд'}
                      {reviewForm.rating === 4 && 'Сайн'}
                      {reviewForm.rating === 5 && 'Маш сайн'}
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Гарчиг (сонголттой)
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Үнэлгээний гарчиг"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сэтгэгдэл <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Бүтээгдэхүүний талаарх сэтгэгдлээ үлдээнэ үү..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !reviewForm.rating || !reviewForm.comment.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    submittingReview || !reviewForm.rating || !reviewForm.comment.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {submittingReview ? 'Илгээж байна...' : 'Үнэлгээ үлдээх'}
                </button>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewForm({ rating: 0, title: '', comment: '', hoverRating: 0 });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Цуцлах
                </button>
              </div>
            </div>
          )}

          {/* Not Authenticated Message */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                Үнэлгээ үлдээхийн тулд нэвтэрнэ үү
              </p>
              <button
                onClick={() => router.push('/auth/login')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Нэвтрэх
              </button>
            </div>
          )}

          {/* Reviews List */}
          {loadingReviews ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Үнэлгээ ачаалж байна...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">{review.userName || 'Хэрэглэгч'}</span>
                      {review.verifiedPurchase && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Баталгаажсан худалдан авалт
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {typeof review.createdAt === 'string' 
                        ? new Date(review.createdAt).toLocaleDateString('mn-MN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : review.createdAt instanceof Date
                        ? review.createdAt.toLocaleDateString('mn-MN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Саяхан'}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{review.title}</h4>
                  )}
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < (review.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {review.comment || 'Тайлбар оруулаагүй.'}
                  </p>
                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {review.images.slice(0, 3).map((img: string, index: number) => (
                        <img
                          key={index}
                          src={img}
                          alt={`Үнэлгээний зураг ${index + 1}`}
                          className="w-16 h-16 rounded object-cover border"
                        />
                      ))}
                    </div>
                  )}
                  {/* Helpful Count */}
                  {review.helpfulCount > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {review.helpfulCount} хүнд тусалсан
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Үнэлгээ байхгүй байна. Анхны үнэлгээгээ үлдээгээрэй!</p>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Fullscreen Zoom Modal */}
      {showZoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-full max-h-[90vh]">
            <button
              onClick={closeZoomModal}
              className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-full h-full flex flex-col lg:flex-row gap-6">
              {/* Zoomed Image in Modal */}
              <div className="flex-1 relative rounded-lg overflow-hidden">
                <img 
                  src={images[selectedImage]} 
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Thumbnails in Modal */}
              <div className="lg:w-32 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 lg:w-full lg:h-20 rounded border overflow-hidden ${
                      selectedImage === idx 
                        ? 'border-white ring-2 ring-white' 
                        : 'border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}