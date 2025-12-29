// app/cart/page.tsx - Complete with Real Google Auth
"use client";

import { useState, useEffect } from 'react';
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowLeft, 
  CreditCard, Truck, Shield, User, Lock, Heart,
  Tag, Eye, EyeOff, Mail, Facebook, Chrome, X, AlertCircle
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const CartPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, login, loginWithGoogle } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateCartItemQuantity, 
    clearCart, 
    cartCount,
    wishlistCount,
    toggleWishlist,
    isInWishlist
  } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{code: string, discount: number} | null>(null);
  
  // Login modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Listen for Google auth success from popup
  // In cart page component (inside the component)
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    // Security: Check origin
    if (event.origin !== window.location.origin) return;
    
    console.log('📨 Message received:', event.data.type);
    
    if (event.data.type === 'google_auth_success') {
      console.log('✅ Google auth successful:', event.data);
      
      // Store the data
      localStorage.setItem('token', event.data.token);
      localStorage.setItem('user', JSON.stringify(event.data.user));
      
      // Close the login modal
      setIsLoginModalOpen(false);
      setIsGoogleRedirecting(false);
      setLoginError(null);
      
      // Redirect to checkout
      setTimeout(() => {
        router.push('/checkout');
      }, 300);
    }
    
    if (event.data.type === 'google_auth_error') {
      console.error('❌ Google auth error:', event.data.message);
      setLoginError(event.data.message);
      setIsGoogleRedirecting(false);
    }
  };
  
  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}, [router]);

  const updateQuantity = (id: number | string, change: number) => {
    const item = cartItems.find(item => item.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      updateCartItemQuantity(id, newQuantity);
    }
  };

  const removeItem = (id: number | string) => {
    removeFromCart(id);
  };

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);

  const discount = cartItems.reduce((sum, item) => {
    const originalPrice = item.product.originalPrice || item.product.price;
    return sum + ((originalPrice - item.product.price) * item.quantity);
  }, 0);

  const shipping = subtotal > 100000 ? 0 : 5000;
  const promoDiscount = appliedPromo?.discount || 0;
  const total = subtotal + shipping - promoDiscount;

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '₮';
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    
    // Mock promo codes - replace with actual API call
    const promoCodes: Record<string, number> = {
      'WELCOME10': 10, // 10% discount
      'SAVE20': 20,    // 20% discount
      'FIRSTORDER': 5000, // 5000₮ discount
    };
    
    const discountValue = promoCodes[promoCode.toUpperCase()];
    
    if (discountValue) {
      const discountAmount = discountValue <= 100 
        ? (subtotal * discountValue) / 100 
        : discountValue;
      
      setAppliedPromo({
        code: promoCode.toUpperCase(),
        discount: Math.min(discountAmount, subtotal)
      });
      setPromoCode('');
    } else {
      alert('Урамшууллын код буруу эсвэл хүчингүй байна.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    router.push('/checkout');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError(null);
    
    try {
      const credentials: any = { password };
      
      // Check if input is email or phone
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        credentials.email = email;
      } else {
        credentials.phone = email;
      }
      
      await login(credentials);
      setIsLoginModalOpen(false);
      setEmail('');
      setPassword('');
      router.push('/checkout');
    } catch (error: any) {
      setLoginError(error.message || 'Нэвтрэхэд алдаа гарлаа. Та имэйл/утас болон нууц үгээ шалгана уу.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoginLoading(true);
    setLoginError(null);
    setIsGoogleRedirecting(true);
    
    try {
      const result = await loginWithGoogle();
      
      if (result.success) {
        setIsLoginModalOpen(false);
        setIsGoogleRedirecting(false);
        router.push('/checkout');
      } else {
        setLoginError('Google нэвтрэхэд алдаа гарлаа');
        setIsGoogleRedirecting(false);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      setLoginError(error.message || 'Google нэвтрэхэд алдаа гарлаа');
      setIsGoogleRedirecting(false);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginError(null);
    setEmail('');
    setPassword('');
    setIsGoogleRedirecting(false);
  };

  const handleMoveToWishlist = (item: any) => {
    toggleWishlist(item.product);
    removeFromCart(item.id);
  };

  const handleContinueShopping = () => {
    router.push('/product');
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Сагсны мэдээлэл ачаалж байна...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Сагс хоосон байна</h1>
            <p className="text-gray-600 mb-8">
              Та сагсанд бараа нэмээгүй байна. Дэлгүүрээс сонирхолтой бараагаа сонгоно уу.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/product"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Дэлгүүр рүү буцах
              </Link>
              {wishlistCount > 0 && (
                <Link
                  href="/wishlist"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <Heart className="w-4 h-4" />
                  Хүслийн жагсаалт ({wishlistCount})
                </Link>
              )}
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
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Таны сагс</h1>
          <div className="flex items-center justify-between mt-2">
            <p className="text-gray-600">{cartCount} бараа</p>
            {isAuthenticated && user && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.full_name} 
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>{user.full_name || user.email || user.phone}</span>
                {user.provider === 'google' && (
                  <Chrome className="w-3 h-3 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Authentication Notice */}
            {!isAuthenticated && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Нэвтэрсэн хэрэглэгчдэд</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      Google хаягаар нэвтрэх эсвэл имэйл/утасны дугаараар бүртгүүлснээр захиалгын түүх хадгалагдах, хялбар төлбөр болно.
                    </p>
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Google хаягаар нэвтрэх
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div 
                  key={`${item.id}-${item.selectedSize}-${item.selectedColor}`} 
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.nameMn}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/100';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900 hover:text-gray-700 cursor-pointer">
                                {item.product.nameMn}
                              </h3>
                              <div className="flex items-center gap-3 mt-2">
                                {item.selectedSize && (
                                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    Хэмжээ: {item.selectedSize}
                                  </span>
                                )}
                                {item.selectedColor && (
                                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    Өнгө: {item.selectedColor}
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-1 rounded ${
                                  item.product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {item.product.inStock ? 'Бэлэн' : 'Дууссан'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatPrice(item.product.price * item.quantity)}
                              </div>
                              {item.product.originalPrice && item.product.originalPrice > item.product.price && (
                                <div className="text-sm text-gray-500 line-through">
                                  {formatPrice(item.product.originalPrice * item.quantity)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors rounded-l"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors rounded-r"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleMoveToWishlist(item)}
                                  className={`transition-colors ${
                                    isInWishlist(item.product.id) 
                                      ? 'text-red-500' 
                                      : 'text-gray-400 hover:text-red-500'
                                  }`}
                                  title="Хүслийн жагсаалтад хадгалах"
                                >
                                  <Heart className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                                  title="Устгах"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-500">
                              Нэгж үнэ: {formatPrice(item.product.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link
                href="/product"
                className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Дэлгүүр рүү буцах
              </Link>
              
              <div className="flex items-center gap-4">
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      alert('Сагс хадгалагдлаа.');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Хадгалах
                  </button>
                )}
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Сагсыг цэвэрлэх
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Захиалгын дүн</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Барааны үнэ</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Хөнгөлөлт</span>
                    <span className="text-green-600 font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
                
                {appliedPromo && (
                  <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Урамшуулал ({appliedPromo.code})</span>
                      <button
                        onClick={handleRemovePromo}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                    <span className="text-green-600 font-medium">-{formatPrice(appliedPromo.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Хүргэлт</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'ҮНЭГҮЙ' : formatPrice(shipping)}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Төлөх дүн</span>
                    <span className="text-xl font-bold text-gray-900">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Урамшууллын код"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                  </div>
                  <button 
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    Хэрэглэх
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Жишээ: WELCOME10, SAVE20, FIRSTORDER
                </p>
              </div>
              
              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg font-bold hover:from-gray-800 hover:to-gray-900 mb-6 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGoogleRedirecting}
              >
                {isGoogleRedirecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Google нэвтэрч байна...
                  </span>
                ) : (
                  `Төлбөр төлөх - ${formatPrice(total)}`
                )}
              </button>
              
              {/* Authentication Status */}
              <div className="mb-6">
                {isAuthenticated ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-800 font-medium">
                        Нэвтэрсэн байна
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Төлбөр төлөх бэлэн боллоо
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-800 font-medium">
                        Нэвтрэх шаардлагатай
                      </span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      Төлбөр төлөхийн тулд нэвтрэнэ үү
                    </p>
                  </div>
                )}
              </div>
              
              {/* Benefits */}
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span>100,000₮-с дээш үнэгүй хүргэлт</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Карт, QPay, банкны шилжүүлэг</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Аюулгүй төлбөр</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>Нэвтэрсэн хэрэглэгчдэд онцгой санал</span>
                </div>
              </div>
              
              {/* Continue Shopping */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleContinueShopping}
                  className="block w-full text-center text-gray-600 hover:text-gray-900 font-medium text-sm py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Үргэлжлүүлэх дэлгүүр →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />

      {/* Login Modal */}
      {isLoginModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
            onClick={handleCloseLoginModal}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div 
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseLoginModal}
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
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Төлбөр төлөхийн тулд нэвтрэх
                  </h2>
                  <p className="text-sm text-gray-600">
                    Төлбөр төлөхийн тулд Google хаягаар нэвтрэнэ үү
                  </p>
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
                    disabled={isGoogleRedirecting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGoogleRedirecting ? (
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
                    disabled={isLoginLoading || isGoogleRedirecting}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-gray-900 to-black text-white text-sm font-medium rounded-lg hover:from-gray-800 hover:to-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98] shadow-sm"
                  >
                    {isLoginLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Нэвтэрч байна...
                      </span>
                    ) : (
                      'Нэвтрэх ба төлбөр төлөх'
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Шинэ хэрэглэгч үү?{' '}
                      <button
                        onClick={() => {
                          setIsLoginModalOpen(false);
                          router.push('/register');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
                      >
                        Бүртгүүлэх
                      </button>
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={handleCloseLoginModal}
                      className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-150 flex items-center justify-center gap-2"
                    >
                      Дараа нэвтрэх
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Төлбөр төлөхийн тулд нэвтрэх шаардлагатай
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;