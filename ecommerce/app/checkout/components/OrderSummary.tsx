"use client";

import { Package, Shield, Truck, Clock } from 'lucide-react';

interface OrderSummaryProps {
  cartItems: any[];
  formData: any;
  subtotal: number;
  shipping: number;
  total: number;
  couponDiscount?: number;
  appliedCoupon?: {code: string, discount: number} | null;
  formatPrice: (price: number) => string;
}

const OrderSummary = ({
  cartItems,
  formData,
  subtotal,
  shipping,
  total,
  couponDiscount = 0,
  appliedCoupon = null,
  formatPrice
}: OrderSummaryProps) => {
  return (
    <div className="lg:col-span-1 order-2 lg:order-1">
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Захиалгын дэлгэрэнгүй</h2>
        
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2">
          {cartItems.map((item, index) => (
            <div key={`${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}-${index}`} className="flex items-center justify-between">
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
            <span>{formatPrice(shipping)}</span>
          </div>
          {couponDiscount > 0 && appliedCoupon && (
            <div className="flex justify-between text-green-600">
              <span>Урамшуулал ({appliedCoupon.code})</span>
              <span>-{formatPrice(couponDiscount)}</span>
            </div>
          )}
          {formData.deliveryMethod === 'delivery' && shipping === 0 && subtotal > 120000 && (
            <div className="text-xs text-green-600 text-right">
              * 120,000₮-с дээш хүргэлтийн нэмэлт төлбөр хөнгөлөгдсөн
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
            <span>Төлбөрийн аюулгүй байдал</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="w-4 h-4" />
            <span>Хүргэлт 24 цаг</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>24/7 захиалга</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;

