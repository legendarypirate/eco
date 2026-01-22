"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProgressSteps from './components/ProgressSteps';
import Step1Content from './components/Step1Content';
import Step2Content from './components/Step2Content';
import Step3Content from './components/Step3Content';
import OrderSummary from './components/OrderSummary';
import InvoiceModal from './components/InvoiceModal';
import { generateInvoicePDF, type InvoiceData } from './utils/invoicePDF';
import { apiService } from '../services/api';

const CheckoutPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { cartItems, clearCart } = useCart();
  
  // State variables
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('qpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrText, setQrText] = useState('');
  const [paymentUrls, setPaymentUrls] = useState<any[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [checkInterval, setCheckInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [latestFormDataForInvoice, setLatestFormDataForInvoice] = useState<any>(null);
  
  // Refs
  const hasPrefilledRef = useRef(false);
  
  // Invoice form state
  const [invoiceFormData, setInvoiceFormData] = useState({
    name: '',
    register: '',
    email: '',
    phone: '',
  });

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
    deliveryMethod: 'delivery',
  });

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (user && isAuthenticated && !hasPrefilledRef.current) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
      hasPrefilledRef.current = true;
    }
  }, [user, isAuthenticated]);

  // Load cart items and redirect if empty
  useEffect(() => {
    if (cartItems.length === 0 && step !== 3) {
      router.push('/cart');
    }
  }, [cartItems.length, router, step]);

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
  const { subtotal, shipping, total } = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    if (formData.deliveryMethod === 'pickup' || formData.deliveryMethod === 'invoice') {
      // Ирж авах: 0
      const shipping = 0;
      const total = subtotal + shipping;
      return { subtotal, shipping, total };
    } else {
      // Хүргэлтээр: 5000 (or 0 if subtotal > 120000)
      const shipping = subtotal > 120000 ? 0 : 5000;
      const total = subtotal + shipping;
      return { subtotal, shipping, total };
    }
  }, [cartItems, formData.deliveryMethod]);

  const formatPrice = useCallback((price: number) => {
    return price.toLocaleString() + '₮';
  }, []);

  // Form input handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      if (name === 'city' && value !== 'Улаанбаатар' && prev.district) {
        return { ...prev, [name]: value, district: '' };
      }
      return { ...prev, [name]: value };
    });
  }, []);

  // Handle delivery method change immediately
  const handleDeliveryMethodChange = useCallback((deliveryMethod: string) => {
    setFormData(prev => ({ ...prev, deliveryMethod }));
  }, []);

  const handleInvoiceInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Fixed Keydown handler - prevents input stuck issue
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Only handle Enter key
    if (e.key !== 'Enter') return;
    
    // Don't prevent default for textareas - allow line breaks
    if (e.currentTarget.tagName === 'TEXTAREA') {
      return;
    }
    
    // Don't interfere with select dropdowns
    if (e.currentTarget.tagName === 'SELECT') {
      return;
    }
    
    // Find the form
    const form = e.currentTarget.closest('form');
    if (!form) return;
    
    // Get all focusable inputs (excluding buttons and radio buttons)
    const inputs = Array.from(
      form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="radio"]):not([type="checkbox"]), textarea')
    ) as HTMLElement[];
    
    const currentIndex = inputs.indexOf(e.currentTarget as HTMLElement);
    
    // If we're not at the last input, move to next
    if (currentIndex > -1 && currentIndex < inputs.length - 1) {
      e.preventDefault();
      e.stopPropagation();
      const nextInput = inputs[currentIndex + 1];
      if (nextInput) {
        // Use requestAnimationFrame to ensure the current input's value is processed
        requestAnimationFrame(() => {
          nextInput.focus();
          // If it's a text input, select the text for easy editing
          if (nextInput instanceof HTMLInputElement && nextInput.type === 'text') {
            nextInput.select();
          }
        });
      }
    }
    // If we're at the last input, let the form submit naturally (don't prevent default)
  }, []);

  const validateForm = useCallback(() => {
    const requiredFields = ['firstName', 'lastName', 'phone'];
    
    if (formData.deliveryMethod === 'delivery') {
      requiredFields.push('address', 'city');
    }
    
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
  }, [formData]);

  const validateInvoiceForm = useCallback(() => {
    if (!invoiceFormData.name || !invoiceFormData.register || !invoiceFormData.email || !invoiceFormData.phone) {
      alert('Бүх талбарыг бөглөнө үү.');
      return false;
    }
    
    if (!/^\d{8}$/.test(invoiceFormData.phone)) {
      alert('Утасны дугаар 8 оронтой байх ёстой.');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(invoiceFormData.email)) {
      alert('Имэйл хаяг буруу байна.');
      return false;
    }
    
    return true;
  }, [invoiceFormData]);

  const createOrderAndQPayInvoice = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      const paymentMethodMap: Record<string, number> = {
        'qpay': 0,
        'bank': 1,
        'card': 2,
      };
      
      let fullShippingAddress = '';
      if (formData.deliveryMethod === 'delivery') {
        const shippingAddressParts = [
          formData.city,
          formData.district && `Дүүрэг: ${formData.district}`,
          formData.khoroo && `Хороо: ${formData.khoroo}`,
          formData.address
        ].filter(Boolean);
        fullShippingAddress = shippingAddressParts.join(', ').trim();
        
        if (!fullShippingAddress || fullShippingAddress.length < 3) {
          throw new Error('Хүргэлтийн хаяг бүрэн оруулна уу');
        }
      } else {
        fullShippingAddress = 'Ирж авах';
      }

      const orderItems = cartItems.map(item => ({
        productId: String(item.product.id || item.id || ''),
        name: item.product.name || 'Бараа',
        nameMn: item.product.nameMn || item.product.name || 'Бараа',
        price: item.product.price || 0,
        quantity: item.quantity || 1,
        image: item.product.image || null,
        sku: item.product.sku || null,
      }));

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

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const orderResponse = await fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResult = await orderResponse.json();
      
      if (!orderResult.success || !orderResult.order?.id) {
        throw new Error('Failed to create order');
      }

      const createdOrder = orderResult.order;
      setCurrentOrderId(createdOrder.id);
      
      if (createdOrder.order_number) {
        setOrderNumber(createdOrder.order_number);
      }

      // Calculate QPay invoice amount based on delivery method
      // Pickup (ирж авах): amount = subtotal (product price only, shipping = 0)
      // Delivery (хүргэлтээр): amount = subtotal + 5000 (or subtotal if subtotal > 120000)
      const qpayAmount = total;

      const invoiceResponse = await fetch(`${API_URL}/qpay/checkout/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
        },
        body: JSON.stringify({
          orderId: createdOrder.id,
          amount: qpayAmount,
          description: `Захиалга - ${createdOrder.order_number}`
        }),
      });

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create QPay invoice');
      }

      const invoiceResult = await invoiceResponse.json();
      
      if (!invoiceResult.success || !invoiceResult.invoice) {
        throw new Error('Failed to create QPay invoice');
      }

      const invoice = invoiceResult.invoice;
      const order = invoiceResult.order;
      
      setInvoiceId(invoice.invoice_id);
      
      const qrTextValue = order?.qrText || invoice.qr_text || '';
      setQrText(qrTextValue);
      
      const qrImageValue = order?.qrImage || invoice.qr_image;
      
      if (qrImageValue) {
        if (qrImageValue.startsWith('data:')) {
          setQrCode(qrImageValue);
        } else if (qrImageValue.startsWith('http://') || qrImageValue.startsWith('https://')) {
          setQrCode(qrImageValue);
        } else {
          setQrCode(`data:image/png;base64,${qrImageValue}`);
        }
      } else if (qrTextValue) {
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrTextValue)}`);
      }
      
      if (invoice.urls && Array.isArray(invoice.urls)) {
        setPaymentUrls(invoice.urls);
      } else if (invoiceResult.invoice?.urls && Array.isArray(invoiceResult.invoice.urls)) {
        setPaymentUrls(invoiceResult.invoice.urls);
      } else {
        setPaymentUrls([
          { name: 'QPay App', link: 'https://qpay.mn/app' },
          { name: 'Khan Bank', link: 'https://khanbank.mn' },
          { name: 'Golomt Bank', link: 'https://golomtbank.com' },
        ]);
      }
      
      setIsProcessing(false);
      startPaymentCheck(invoice.invoice_id);
      
    } catch (error: any) {
      console.error('QPay invoice creation failed:', error);
      alert(`Төлбөрийн системд алдаа гарлаа: ${error?.message || 'Тодорхойгүй алдаа'}. Дахин оролдоно уу.`);
      setIsProcessing(false);
    }
  }, [cartItems, formData, paymentMethod, subtotal, shipping, total, isAuthenticated, user]);

  const handleProceedToPayment = useCallback(async (data?: any) => {
    // If data is provided (from react-hook-form), update formData state
    if (data) {
      setFormData(prev => ({ ...prev, ...data }));
    }

    // Use the provided data or fall back to formData state
    const currentFormData = data || formData;
    
    // Validate using the current form data
    const requiredFields = ['firstName', 'lastName', 'phone'];
    
    if (currentFormData.deliveryMethod === 'delivery') {
      requiredFields.push('address', 'city');
    }
    
    for (const field of requiredFields) {
      if (!currentFormData[field as keyof typeof currentFormData]) {
        alert(`Та ${field === 'firstName' ? 'нэр' : field === 'lastName' ? 'овог' : field === 'phone' ? 'утасны дугаар' : field === 'address' ? 'хаяг' : 'хот'}-аа оруулна уу.`);
        return;
      }
    }
    
    if (!/^\d{8}$/.test(currentFormData.phone)) {
      alert('Утасны дугаар 8 оронтой байх ёстой.');
      return;
    }
    
    if (currentFormData.email && !/\S+@\S+\.\S+/.test(currentFormData.email)) {
      alert('Имэйл хаяг буруу байна.');
      return;
    }

    try {
      if (isAuthenticated) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        // Save user profile info (firstName, lastName, phone, email)
        try {
          await fetch(`${API_URL}/user/shipping-info`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(currentFormData),
          });
        } catch (shippingError) {
          console.error('Failed to save shipping info:', shippingError);
        }

        // Save address to addresses table if delivery method is 'delivery'
        if (currentFormData.deliveryMethod === 'delivery' && currentFormData.city && currentFormData.address) {
          try {
            await apiService.saveAddress({
              city: currentFormData.city,
              district: currentFormData.district || undefined,
              khoroo: currentFormData.khoroo || undefined,
              address: currentFormData.address,
              is_default: false, // Don't automatically set as default
            });
          } catch (addressError) {
            console.error('Failed to save address:', addressError);
            // Don't block the checkout flow if address save fails
          }
        }
      }

      // Update formData state before proceeding
      if (data) {
        setFormData(currentFormData);
      }

      setStep(2);
      await createOrderAndQPayInvoice();
    } catch (error) {
      console.error('Failed to proceed to payment:', error);
      alert('Төлбөрийн системд алдаа гарлаа. Дахин оролдоно уу.');
    }
  }, [formData, isAuthenticated, createOrderAndQPayInvoice]);

  const completeOrder = useCallback(async () => {
    try {
      if (currentOrderId) {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        try {
          await fetch(`${API_URL}/order/${currentOrderId}/delivery/chuchu`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
            },
          });
        } catch (chuchuError) {
          console.error('Chuchu API error after payment:', chuchuError);
        }
      }
      
      clearCart();
      setStep(3);
      
    } catch (error: any) {
      console.error('Failed to complete order:', error);
      clearCart();
      setStep(3);
    }
  }, [currentOrderId, clearCart, isAuthenticated]);

  const startPaymentCheck = useCallback((invoiceId: string) => {
    if (checkInterval) clearInterval(checkInterval);
    
    const interval = setInterval(async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${API_URL}/qpay/check/${invoiceId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.payment?.isPaid) {
            setPaymentStatus('paid');
            setIsProcessing(false);
            clearInterval(interval);
            setCheckInterval(null);
            
            setTimeout(() => {
              completeOrder();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Payment check error:', error);
      }
    }, 5000);
    
    setCheckInterval(interval);
  }, [checkInterval, isAuthenticated, completeOrder]);

  const handleCreateInvoice = useCallback(async (e?: React.MouseEvent, formDataOverride?: any) => {
    if (e) {
      e.preventDefault();
    }
    
    // Use provided form data or fall back to state
    const currentFormData = formDataOverride || formData;
    
    // Store the latest form data for use in handleSubmitInvoice
    setLatestFormDataForInvoice(currentFormData);
    
    // Also update formData state to keep it in sync
    if (formDataOverride) {
      setFormData(prev => ({ ...prev, ...formDataOverride }));
    }
    
    // Validate using the current form data
    if (!currentFormData.firstName || currentFormData.firstName.trim() === '') {
      alert('Та нэр-ээ оруулна уу.');
      return;
    }
    
    if (!currentFormData.lastName || currentFormData.lastName.trim() === '') {
      alert('Та овог-оо оруулна уу.');
      return;
    }
    
    if (!currentFormData.phone || currentFormData.phone.trim() === '') {
      alert('Та утасны дугаар-аа оруулна уу.');
      return;
    }
    
    // Validate phone format
    if (!/^\d{8}$/.test(currentFormData.phone.trim())) {
      alert('Утасны дугаар 8 оронтой байх ёстой.');
      return;
    }
    
    // Validate email if provided
    if (currentFormData.email && currentFormData.email.trim() !== '' && !/\S+@\S+\.\S+/.test(currentFormData.email.trim())) {
      alert('Имэйл хаяг буруу байна.');
      return;
    }
    
    // Note: Address validation is not needed for invoice method (pickup)
    
    setInvoiceFormData({
      name: '',
      register: '',
      email: currentFormData.email || '',
      phone: currentFormData.phone || '',
    });
    
    setShowInvoiceModal(true);
  }, [formData]);

  const handleSubmitInvoice = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validateInvoiceForm()) return;

    try {
      setIsCreatingInvoice(true);
      
      const fullShippingAddress = 'Ирж авах';

      const orderItems = cartItems.map(item => ({
        productId: String(item.product.id || item.id || ''),
        name: item.product.name || 'Бараа',
        nameMn: item.product.nameMn || item.product.name || 'Бараа',
        price: item.product.price || 0,
        quantity: item.quantity || 1,
        image: item.product.image || null,
        sku: item.product.sku || null,
      }));

      const orderData = {
        userId: isAuthenticated ? user?.id : `guest_${Date.now()}`,
        items: orderItems,
        subtotal: subtotal,
        shippingCost: 0, // Ирж авах: 0
        tax: 0,
        grandTotal: subtotal, // Ирж авах: subtotal only
        paymentMethod: 1,
        shippingAddress: fullShippingAddress,
        phoneNumber: invoiceFormData.phone || (latestFormDataForInvoice || formData).phone,
        customerName: invoiceFormData.name || `${(latestFormDataForInvoice || formData).firstName} ${(latestFormDataForInvoice || formData).lastName}`.trim(),
        notes: (latestFormDataForInvoice || formData).note || null,
        invoiceData: {
          name: invoiceFormData.name,
          register: invoiceFormData.register,
          email: invoiceFormData.email,
          phone: invoiceFormData.phone,
        },
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const orderResponse = await fetch(`${API_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create order');
      }

      const orderResult = await orderResponse.json();
      
      if (!orderResult.success || !orderResult.order?.id) {
        throw new Error('Failed to create order');
      }

      const createdOrder = orderResult.order;
      
      if (createdOrder.order_number) {
        setOrderNumber(createdOrder.order_number);
      }

      // Save address and shipping info when invoice is downloaded
      if (isAuthenticated) {
        console.log('[Invoice PDF] Saving address and shipping info for authenticated user');
        
        // Use latest form data if available, otherwise fall back to formData state
        const currentFormData = latestFormDataForInvoice || formData;
        
        // Save user profile info (firstName, lastName, phone, email)
        try {
          const shippingInfoData = {
            firstName: currentFormData.firstName,
            lastName: currentFormData.lastName,
            phone: invoiceFormData.phone || currentFormData.phone,
            email: invoiceFormData.email || currentFormData.email,
          };
          
          console.log('[Invoice PDF] Saving shipping info:', shippingInfoData);
          
          const shippingInfoResponse = await fetch(`${API_URL}/user/shipping-info`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(shippingInfoData),
          });
          
          if (shippingInfoResponse.ok) {
            const shippingResult = await shippingInfoResponse.json();
            console.log('[Invoice PDF] Shipping info saved successfully:', shippingResult);
          } else {
            console.warn('[Invoice PDF] Failed to save shipping info:', await shippingInfoResponse.text());
          }
        } catch (shippingError) {
          console.error('[Invoice PDF] Error saving shipping info:', shippingError);
        }

        // Save address to addresses table if address information is available
        if (currentFormData.city && currentFormData.address) {
          try {
            const addressData = {
              city: currentFormData.city,
              district: currentFormData.district || undefined,
              khoroo: currentFormData.khoroo || undefined,
              address: currentFormData.address,
              is_default: false, // Don't automatically set as default
            };
            
            console.log('[Invoice PDF] Saving address:', addressData);
            
            const addressSaveResult = await apiService.saveAddress(addressData);
            
            if (addressSaveResult.success) {
              console.log('[Invoice PDF] Address saved successfully:', {
                address: addressSaveResult.address,
                isDuplicate: addressSaveResult.isDuplicate,
                message: addressSaveResult.message
              });
            } else {
              console.warn('[Invoice PDF] Failed to save address:', addressSaveResult.message);
            }
          } catch (addressError) {
            console.error('[Invoice PDF] Error saving address:', addressError);
            // Don't block the invoice flow if address save fails
          }
        } else {
          console.log('[Invoice PDF] Skipping address save - city or address not provided', {
            city: currentFormData.city,
            address: currentFormData.address,
            district: currentFormData.district,
            latestFormDataForInvoice: latestFormDataForInvoice,
            formData: formData
          });
        }
      } else {
        console.log('[Invoice PDF] Skipping address save - user not authenticated');
      }

      const invoiceResponse = await fetch(`${API_URL}/order/${createdOrder.id}/invoice/chuchu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(isAuthenticated && { 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
        },
        body: JSON.stringify({
          address: fullShippingAddress,
          khoroo: '',
          phone: invoiceFormData.phone || (latestFormDataForInvoice || formData).phone,
          invoiceData: invoiceFormData,
        }),
      });

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create invoice');
      }

      // Generate PDF client-side with same style as backend
      const invoiceResponseData = await invoiceResponse.json();
      
      // Calculate tax (10% VAT)
      // Prices in cart include VAT, so we need to extract VAT
      const taxRate = 0.1;
      const taxMultiplier = 1 + taxRate; // 1.1
      
      // Calculate subtotal without VAT (prices in cart include VAT)
      const subtotalWithoutVat = subtotal / taxMultiplier;
      const calculatedTax = subtotalWithoutVat * taxRate;
      const totalWithTax = subtotalWithoutVat + calculatedTax; // Should equal original subtotal
      const shippingCost = 0; // Ирж авах: 0
      const finalTotal = totalWithTax + shippingCost;
      
      // Prepare invoice items (prices without VAT)
      const invoiceItems = cartItems.map(item => {
        // Item price includes VAT, so divide by taxMultiplier to get price without VAT
        const unitPriceWithVat = item.product.price;
        const unitPriceWithoutVat = unitPriceWithVat / taxMultiplier;
        const lineTotalWithoutVat = unitPriceWithoutVat * item.quantity;
        return {
          description: item.product.nameMn || item.product.name || 'Бараа',
          quantity: item.quantity,
          price: unitPriceWithoutVat,
          total: lineTotalWithoutVat,
        };
      });
      
      // Format dates
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from today
      
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
      };
      
      // Issuer information (matching backend)
      const invoiceData: InvoiceData = {
        invoiceNumber: createdOrder.order_number || `INV-${createdOrder.id}`,
        invoiceDate: formatDate(today),
        dueDate: formatDate(dueDate),
        customerName: invoiceFormData.name || `${(latestFormDataForInvoice || formData).firstName} ${(latestFormDataForInvoice || formData).lastName}`.trim(),
        customerEmail: invoiceFormData.email || (latestFormDataForInvoice || formData).email || '',
        customerPhone: invoiceFormData.phone || (latestFormDataForInvoice || formData).phone || '',
        issuerName: 'ТЭРГҮҮН ГЭРЭГЭ ХХК',
        issuerRegister: '6002536',
        issuerEmail: '',
        issuerPhone: '7000-5060, 98015060',
        issuerAddress: 'ХУД, 2-р хороо, Дунд Гол гудамж, Хийморь хотхон, 34 р байр',
        issuerBankName: 'M банк',
        issuerBankAccount: '9006002536',
        issuerBankIban: '',
        items: invoiceItems,
        subtotal: subtotalWithoutVat,
        tax: calculatedTax,
        total: finalTotal,
        notes: (latestFormDataForInvoice || formData).note || undefined,
      };
      
      // Generate and download PDF
      console.log('[Invoice PDF] Generating PDF invoice...');
      await generateInvoicePDF(invoiceData);
      console.log('[Invoice PDF] PDF invoice generated and downloaded successfully');

      clearCart();
      setShowInvoiceModal(false);
      setStep(3);
      
    } catch (error: any) {
      console.error('Invoice creation failed:', error);
      alert(`Нэхэмжлэх үүсгэхэд алдаа гарлаа: ${error?.message || 'Тодорхойгүй алдаа'}. Дахин оролдоно уу.`);
    } finally {
      setIsCreatingInvoice(false);
    }
  }, [cartItems, formData, invoiceFormData, subtotal, clearCart, validateInvoiceForm, isAuthenticated, user, latestFormDataForInvoice]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [checkInterval]);

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

  const MainContent = () => (
    <div className="container mx-auto px-4 py-8">
      <ProgressSteps step={step} />
      
      <div className="grid lg:grid-cols-3 gap-8">
        <OrderSummary
          cartItems={cartItems}
          formData={formData}
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          formatPrice={formatPrice}
        />
        
        <div className="lg:col-span-2 order-1 lg:order-2">
          {step === 1 && (
            <Step1Content
              formData={formData}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleProceedToPayment={handleProceedToPayment}
              handleCreateInvoice={handleCreateInvoice}
              handleDeliveryMethodChange={handleDeliveryMethodChange}
              isAuthenticated={isAuthenticated}
              subtotal={subtotal}
              total={total}
              isCreatingInvoice={isCreatingInvoice}
              isProcessing={isProcessing}
              formatPrice={formatPrice}
            />
          )}
          {step === 2 && (
            <Step2Content
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              isProcessing={isProcessing}
              qrCode={qrCode}
              qrText={qrText}
              paymentUrls={paymentUrls}
              paymentStatus={paymentStatus}
              orderNumber={orderNumber}
              total={total}
              formatPrice={formatPrice}
              completeOrder={completeOrder}
              setStep={setStep}
            />
          )}
          {step === 3 && (
            <Step3Content
              orderNumber={orderNumber}
              total={total}
              formData={formData}
              paymentMethod={paymentMethod}
              isAuthenticated={isAuthenticated}
              formatPrice={formatPrice}
            />
          )}
        </div>
      </div>
    </div>
  );

  // If step 3 (success) is reached, show without protection
  if (step === 3) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <MainContent />
          <Footer />
        </div>
        <InvoiceModal
          showInvoiceModal={showInvoiceModal}
          invoiceFormData={invoiceFormData}
          isCreatingInvoice={isCreatingInvoice}
          handleInvoiceInputChange={handleInvoiceInputChange}
          handleKeyDown={handleKeyDown}
          handleSubmitInvoice={handleSubmitInvoice}
          setShowInvoiceModal={setShowInvoiceModal}
          setInvoiceFormData={setInvoiceFormData}
        />
      </>
    );
  }

  // For steps 1-2, require authentication
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <MainContent />
        <Footer />
      </div>
      <InvoiceModal
        showInvoiceModal={showInvoiceModal}
        invoiceFormData={invoiceFormData}
        isCreatingInvoice={isCreatingInvoice}
        handleInvoiceInputChange={handleInvoiceInputChange}
        handleKeyDown={handleKeyDown}
        handleSubmitInvoice={handleSubmitInvoice}
        setShowInvoiceModal={setShowInvoiceModal}
        setInvoiceFormData={setInvoiceFormData}
      />
    </ProtectedRoute>
  );
};

export default CheckoutPage;
