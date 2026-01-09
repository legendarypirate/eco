// app/checkout/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, CreditCard, Smartphone, Wallet, Truck, 
  Shield, CheckCircle, Clock, AlertCircle, QrCode,
  MapPin, User, Phone, Mail, Package, Lock, Home
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';

const CheckoutPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cartItems, clearCart, cartTotal, cartCount } = useCart();
  
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Success
  const [paymentMethod, setPaymentMethod] = useState('qpay'); // qpay, card, bank
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrText, setQrText] = useState('');
  const [paymentUrls, setPaymentUrls] = useState<any[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [orderNumber, setOrderNumber] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Улаанбаатар',
    district: '',
    khoroo: '',
    note: '',
    deliveryMethod: 'delivery', // delivery or pickup
  });

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user, isAuthenticated]);

  // Load cart items and redirect if empty
  useEffect(() => {
    if (cartItems.length === 0 && step !== 3) {
      router.push('/cart');
    }
  }, [cartItems, router, step]);

  // Generate order number
  useEffect(() => {
    const generateOrderNumber = () => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      return `ORD-${timestamp}-${random}`;
    };
    setOrderNumber(generateOrderNumber());
  }, []);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 100000 ? 0 : 5000;
  const total = subtotal + shipping;

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '₮';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Reset district when city changes from Улаанбаатар to something else
      if (name === 'city' && value !== 'Улаанбаатар' && prev.district) {
        return { ...prev, [name]: value, district: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const validateForm = () => {
    const requiredFields = ['firstName', 'lastName', 'phone', 'address', 'city'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`Та ${field === 'firstName' ? 'нэр' : field === 'lastName' ? 'овог' : field === 'phone' ? 'утасны дугаар' : field === 'address' ? 'хаяг' : 'хот'}-аа оруулна уу.`);
        return false;
      }
    }
    
    if (!/^\d{8}$/.test(formData.phone)) {
      alert('Утасны дугаар 8 оронтой байх ёстой.');
      return false;
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      alert('Имэйл хаяг буруу байна.');
      return false;
    }
    
    return true;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) return;

    try {
      // Save shipping info to user's account if authenticated
      if (isAuthenticated) {
        // You can save the shipping info to user's profile here
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        await fetch(`${API_URL}/users/shipping-info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(formData),
        });
      }

      setStep(2);
      createQPayInvoice();
    } catch (error) {
      console.error('Failed to save shipping info:', error);
      // Continue anyway since this is not critical
      setStep(2);
      createQPayInvoice();
    }
  };

  // Mock QPay service - replace with actual implementation
  const createQPayInvoice = async () => {
    try {
      setIsProcessing(true);
      
      // Generate unique invoice number
      const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const randomInvoiceId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Generate random QR text for demo
      const randomQrText = `QPAY:${randomInvoiceId}:${total}:${Math.random().toString(36).substr(2, 9)}`;
      
      // Immediately generate QR code (no delay)
      const mockResponse = {
        invoice_id: randomInvoiceId,
        qr_text: randomQrText,
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(randomQrText)}`,
        urls: [
          { name: 'QPay App', link: 'https://qpay.mn/app' },
          { name: 'Khan Bank', link: 'https://khanbank.mn' },
          { name: 'Golomt Bank', link: 'https://golomtbank.com' },
        ]
      };
      
      setInvoiceId(mockResponse.invoice_id);
      setQrText(mockResponse.qr_text);
      setQrCode(mockResponse.qr_code);
      setPaymentUrls(mockResponse.urls);
      
      // Stop processing to show QR code
      setIsProcessing(false);
      
      // Start checking payment status (mock) - will auto-complete after 3 seconds
      startPaymentCheck(mockResponse.invoice_id);
      
    } catch (error) {
      console.error('QPay invoice creation failed:', error);
      alert('Төлбөрийн системд алдаа гарлаа. Дахин оролдоно уу.');
      setIsProcessing(false);
    }
  };

  const startPaymentCheck = (invoiceId: string) => {
    // Clear existing interval
    if (checkInterval) clearInterval(checkInterval);
    
    // Auto-complete payment after 3 seconds for demo (since we don't have QPay API yet)
    setTimeout(() => {
      setPaymentStatus('paid');
      setIsProcessing(false);
      
      if (checkInterval) clearInterval(checkInterval);
      
      // Move to success step after 1 second
      setTimeout(() => {
        completeOrder();
      }, 1000);
    }, 3000); // 3 seconds delay to show QR code
    
    // Also set up interval check in case user wants to manually check
    const interval = setInterval(async () => {
      // For demo: always return paid after initial delay
      if (paymentStatus === 'paid') {
        clearInterval(interval);
      }
    }, 5000);
    
    setCheckInterval(interval);
  };

  const completeOrder = async () => {
    try {
      // Map payment method to backend format: 0: QPay, 1: Cash, 2: Card, 3: SocialPay
      const paymentMethodMap: Record<string, number> = {
        'qpay': 0,
        'bank': 1,
        'card': 2,
      };
      
      // Format shipping address
      const shippingAddressParts = [
        formData.city,
        formData.district && `Дүүрэг: ${formData.district}`,
        formData.khoroo && `Хороо: ${formData.khoroo}`,
        formData.address
      ].filter(Boolean);
      const fullShippingAddress = shippingAddressParts.join(', ');

      // Transform cart items to backend format
      const orderItems = cartItems.map(item => ({
        productId: String(item.product.id || item.id || ''),
        name: item.product.name || 'Бараа',
        nameMn: item.product.nameMn || item.product.name || 'Бараа',
        price: item.product.price || 0,
        quantity: item.quantity || 1,
        image: item.product.image || null,
        sku: item.product.sku || null,
      }));

      // Prepare order data in backend expected format
      const orderData = {
        userId: isAuthenticated ? user?.id : `guest_${Date.now()}`,
        items: orderItems,
        subtotal: subtotal,
        shippingCost: shipping,
        tax: 0,
        grandTotal: total,
        paymentMethod: paymentMethodMap[paymentMethod] || 0,
        shippingAddress: fullShippingAddress,
        phoneNumber: formData.phone,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        notes: formData.note || null,
      };

      // Send order to API (correct endpoint: /api/order, not /api/orders)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Order creation failed:', errorData);
        throw new Error(errorData.message || 'Failed to save order');
      }

      const result = await response.json();
      
      // Update order number with the one from backend
      if (result.success && result.order?.order_number) {
        setOrderNumber(result.order.order_number);
      }
      
      // Update payment status to Paid (1) if order was created successfully
      if (result.success && result.order?.id) {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
          await fetch(`${API_URL}/order/${result.order.id}/payment`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
            },
            body: JSON.stringify({ payment_status: 1 }), // 1 = Paid
          });
        } catch (paymentStatusError) {
          console.error('Failed to update payment status:', paymentStatusError);
          // Don't throw - order was created successfully
        }
      }

      // Clear cart and move to success step
      clearCart();
      setStep(3);
      
    } catch (error: any) {
      console.error('Failed to complete order:', error);
      const errorMessage = error?.message || 'Тодорхойгүй алдаа';
      alert(`Захиалга хадгалахад алдаа гарлаа: ${errorMessage}. Гэхдээ төлбөр амжилттай төлөгдлөө. Манай байгууллагатай холбогдоно уу. Захиалгын дугаар: ${orderNumber}`);
      // Still clear cart and show success to prevent double payment
      clearCart();
      setStep(3);
    }
  };

  const handleManualPaymentCheck = async () => {
    if (!invoiceId) return;
    
    try {
      // Mock payment check - for demo, always return paid
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentStatus('paid');
      setIsProcessing(false);
      
      if (checkInterval) clearInterval(checkInterval);
      
      completeOrder();
    } catch (error) {
      console.error('Manual payment check failed:', error);
      alert('Төлбөрийн статус шалгахад алдаа гарлаа.');
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [checkInterval]);

  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
  };

  const handleLoginRedirect = () => {
    router.push('/?login_required=true&redirect=/checkout');
  };

  // Render steps
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* User Authentication Notice */}
      {!isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Нэвтэрсэн хэрэглэгчдэд</h3>
              <p className="text-sm text-blue-700 mb-3">
                Нэвтэрч орсноор захиалгын түүхийг хадгалах, дараагийн удаа бөглөх шаардлагагүй болно.
              </p>
              <button
                onClick={handleLoginRedirect}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
              >
                Нэвтрэх / Бүртгүүлэх
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Холбоо барих мэдээлэл
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Нэр *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Овог *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Утасны дугаар *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="88888888"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имэйл хаяг
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="name@example.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Хүргэлтийн хаяг
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Хот *
            </label>
            <select
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="Улаанбаатар">Улаанбаатар</option>
              <option value="Дархан">Дархан</option>
              <option value="Эрдэнэт">Эрдэнэт</option>
              <option value="бусад">Бусад</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дүүрэг
              </label>
              {formData.city === 'Улаанбаатар' ? (
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Дүүрэг сонгох</option>
                  <option value="Баянзүрх">Баянзүрх</option>
                  <option value="Сонгинохайрхан">Сонгинохайрхан</option>
                  <option value="Хан-Уул">Хан-Уул</option>
                  <option value="Баянгол">Баянгол</option>
                  <option value="Сүхбаатар">Сүхбаатар</option>
                  <option value="Чингэлтэй">Чингэлтэй</option>
                </select>
              ) : (
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Дүүрэг"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Хороо
              </label>
              <input
                type="text"
                name="khoroo"
                value={formData.khoroo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="15-р хороо"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дэлгэрэнгүй хаяг *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Home className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Байр, орц, давхар, тоот"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Method */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Хүргэлтийн арга
        </h2>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryMethod"
              value="delivery"
              checked={formData.deliveryMethod === 'delivery'}
              onChange={handleInputChange}
              className="w-4 h-4 text-gray-900 focus:ring-gray-900 mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">Хүргэлт</div>
              <div className="text-sm text-gray-600 mt-1">
                {shipping === 0 ? 'Үнэгүй' : `${formatPrice(shipping)}`} - 2-3 хоногт
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Таны зааж өгсөн хаягт хүргэж өгнө
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryMethod"
              value="pickup"
              checked={formData.deliveryMethod === 'pickup'}
              onChange={handleInputChange}
              className="w-4 h-4 text-gray-900 focus:ring-gray-900 mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">Өөрөө авах</div>
              <div className="text-sm text-gray-600 mt-1">Үнэгүй - Одоо авах боломжтой</div>
              <div className="text-xs text-gray-500 mt-2">
                Улаанбаатар хот, Сонгинохайрхан дүүрэг, 1018shop дэлгүүр
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Тэмдэглэл</h2>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          rows={3}
          placeholder="Тайлбар, зөвлөмж, хүргэлтийн заавар..."
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Link
          href="/cart"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Сагс руу буцах
        </Link>
        <button
          onClick={handleProceedToPayment}
          className="px-8 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:from-gray-800 hover:to-gray-900 font-medium shadow-sm"
        >
          Төлбөр төлөх - {formatPrice(total)}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Төлбөрийн арга</h2>
        
        {/* Payment Method Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => handlePaymentMethodSelect('qpay')}
            className={`p-4 border rounded-lg text-center transition-all ${
              paymentMethod === 'qpay'
                ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900 ring-opacity-20'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <QrCode className={`w-8 h-8 ${paymentMethod === 'qpay' ? 'text-gray-900' : 'text-gray-400'}`} />
              <div className="font-medium">QPay</div>
              <div className="text-xs text-gray-500">QR код, апп</div>
            </div>
          </button>
          
          <button
            onClick={() => handlePaymentMethodSelect('card')}
            className={`p-4 border rounded-lg text-center transition-all ${
              paymentMethod === 'card'
                ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900 ring-opacity-20'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <CreditCard className={`w-8 h-8 ${paymentMethod === 'card' ? 'text-gray-900' : 'text-gray-400'}`} />
              <div className="font-medium">Карт</div>
              <div className="text-xs text-gray-500">Visa, Mastercard</div>
            </div>
          </button>
          
          <button
            onClick={() => handlePaymentMethodSelect('bank')}
            className={`p-4 border rounded-lg text-center transition-all ${
              paymentMethod === 'bank'
                ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900 ring-opacity-20'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <Wallet className={`w-8 h-8 ${paymentMethod === 'bank' ? 'text-gray-900' : 'text-gray-400'}`} />
              <div className="font-medium">Банкны шилжүүлэг</div>
              <div className="text-xs text-gray-500">Хаан, Голомт, ХХБ</div>
            </div>
          </button>
        </div>

        {/* Payment Sections */}
        {paymentMethod === 'qpay' && (
          <div className="text-center py-6">
            {isProcessing ? (
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-600">Төлбөрийн мэдээлэл бэлдэж байна...</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-4">Доорх QR кодыг QPay апп-аар уншуулна уу</p>
                  {qrCode && (
                    <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                      <img src={qrCode} alt="QPay QR Code" className="w-48 h-48 mx-auto" />
                    </div>
                  )}
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">Эсвэл QPay апп-аар доорх дугаарыг оруулна уу:</p>
                  {qrText && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <code className="text-lg font-mono font-bold text-gray-900 break-all">
                        {qrText}
                      </code>
                    </div>
                  )}
                </div>
                
                {/* Mobile App Links */}
                {paymentUrls.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Төлбөр төлөх:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {paymentUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                        >
                          <Smartphone className="w-4 h-4" />
                          {url.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Төлбөр төлсний дараа доорх товчийг дарна уу</p>
                      <p>Төлбөр автоматаар шалгагдах боловч төлбөр төлөгдсөн эсэхийг шалгахыг хүсвэл доорх товчийг дарна уу.</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleManualPaymentCheck}
                  disabled={paymentStatus === 'paid'}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto transition-all ${
                    paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
                  }`}
                >
                  {paymentStatus === 'paid' ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Төлбөр төлөгдсөн
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      Төлбөрийг шалгах
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Card Payment Section */}
        {paymentMethod === 'card' && (
          <div className="py-6">
            <div className="max-w-md mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  Картаар төлбөр хийх функц хөгжүүлэгдэж байна. Та QPay эсвэл банкны шилжүүлэг сонгоно уу.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Bank Transfer Section */}
        {paymentMethod === 'bank' && (
          <div className="py-6">
            <div className="max-w-lg mx-auto">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-2">Хаан банк</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Дансны дугаар:</span>
                      <span className="font-mono font-bold">5012345678</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Дансны нэр:</span>
                      <span className="font-medium">1018shop LLC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Гүйлгээний утга:</span>
                      <span className="font-medium">{orderNumber}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-2">Голомт банк</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Дансны дугаар:</span>
                      <span className="font-mono font-bold">4012345678</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Дансны нэр:</span>
                      <span className="font-medium">1018shop LLC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Гүйлгээний утга:</span>
                      <span className="font-medium">{orderNumber}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>✅ Гүйлгээ хийсний дараа гүйлгээний дэлгэрэнгүйг таны утасны дугаар руу илгээнэ үү.</p>
                  <p>✅ Банкны шилжүүлэг хийсний дараа манай байгууллагатай холбогдон баталгаажуулна уу.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Буцах
            </button>
            
            {paymentMethod === 'bank' && (
              <button
                onClick={() => {
                  completeOrder();
                }}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
              >
                Гүйлгээ хийсэн
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Баяр хүргэе!</h1>
        <p className="text-gray-600 mb-8">
          Таны захиалга амжилттай хүлээн авлаа. Захиалгын дугаар: <strong>{orderNumber}</strong>
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-gray-900 mb-4">Захиалгын дэлгэрэнгүй</h3>
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Захиалгын дугаар:</span>
              <span className="font-medium">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Нийт дүн:</span>
              <span className="font-bold">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Хүргэлтийн хаяг:</span>
              <span className="font-medium text-right">{formData.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Утасны дугаар:</span>
              <span className="font-medium">{formData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Төлбөрийн арга:</span>
              <span className="font-medium">
                {paymentMethod === 'qpay' ? 'QPay' : 
                 paymentMethod === 'card' ? 'Карт' : 'Банкны шилжүүлэг'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Бэлтгэгдэж байна
            </div>
            <div className="hidden sm:block">→</div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Хүргэлтэнд гарсан
            </div>
            <div className="hidden sm:block">→</div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Хүргэгдсэн
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/product"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            Үргэлжлүүлэх дэлгүүр
          </Link>
          {isAuthenticated ? (
            <Link
              href="/orders"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Миний захиалгууд
            </Link>
          ) : (
            <button
              onClick={handleLoginRedirect}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Бүртгүүлэх
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-8">
          Захиалгын статусын талаар {formData.phone} дугаар руу мэдэгдэл илгээх болно.
        </p>
      </div>
    </div>
  );

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Ачааллаж байна...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Wrap with ProtectedRoute if user is not authenticated
  const MainContent = () => (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                1
              </div>
              <div className={`h-1 w-20 ${step >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
              <div className={`h-1 w-20 ${step >= 3 ? 'bg-gray-900' : 'bg-gray-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                3
              </div>
            </div>
          </div>
          
          <div className="flex justify-center text-sm">
            <div className="text-center w-24 mr-20">
              <div className={`font-medium ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                Мэдээлэл
              </div>
            </div>
            <div className="text-center w-24 mr-20">
              <div className={`font-medium ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                Төлбөр
              </div>
            </div>
            <div className="text-center w-24">
              <div className={`font-medium ${step >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
                Баталгаажуулалт
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary (always visible) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Захиалгын дэлгэрэнгүй</h2>
              
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                        {item.product.image ? (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.jpg';
                            }}
                          />
                        ) : (
                          <Package className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{item.product.name}</div>
                        <div className="text-sm text-gray-500">x{item.quantity}</div>
                        <div className="text-xs text-gray-400">
                          {item.selectedSize && `Хэмжээ: ${item.selectedSize}`}
                          {item.selectedColor && ` • Өнгө: ${item.selectedColor}`}
                        </div>
                      </div>
                    </div>
                    <div className="font-medium whitespace-nowrap ml-2">
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Барааны үнэ</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Хүргэлтийн төлбөр</span>
                  <span>{shipping === 0 ? 'Үнэгүй' : formatPrice(shipping)}</span>
                </div>
                {shipping === 0 && subtotal < 100000 && (
                  <div className="text-xs text-green-600 text-right">
                    * 100,000₮-с дээш үнэгүй хүргэлт
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                  <span>Нийт дүн</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>Аюулгүй төлбөр</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span>Хүргэлт 2-3 хоног</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>24/7 дэмжлэг</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );

  // If step 3 (success) is reached, show without protection
  if (step === 3) {
    return <MainContent />;
  }

  // For steps 1-2, require authentication
  return (
    <ProtectedRoute>
      <MainContent />
    </ProtectedRoute>
  );
};

export default CheckoutPage;