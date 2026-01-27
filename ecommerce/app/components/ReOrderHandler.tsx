"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReOrderModal from './ReOrderModal';

interface OrderItem {
  id: number;
  product_id: string;
  name: string;
  name_mn: string;
  price: number;
  quantity: number;
  image: string | null;
  sku: string | null;
}

interface Order {
  id: number;
  order_number: string;
  grand_total: number;
  created_at: string;
  shipping_address: string;
  phone_number: string;
  customer_name: string;
  items: OrderItem[];
}

export default function ReOrderHandler() {
  const { user, isAuthenticated } = useAuth();
  const [lastDeliveredOrder, setLastDeliveredOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only check once when user logs in
    if (isAuthenticated && user && !hasChecked) {
      // Small delay to ensure auth state is fully settled
      const timer = setTimeout(() => {
        // Check if modal was already shown in this session
        if (sessionStorage.getItem('reorder_modal_shown') !== 'true') {
          checkLastDeliveredOrder();
        }
        setHasChecked(true);
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (!isAuthenticated) {
      // Reset when user logs out
      setHasChecked(false);
      setLastDeliveredOrder(null);
      setIsModalOpen(false);
      // Clear sessionStorage flag on logout so it shows again on next login
      sessionStorage.removeItem('reorder_modal_shown');
    }
  }, [isAuthenticated, user, hasChecked]);

  const checkLastDeliveredOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Don't check if modal was already shown in this session
      if (sessionStorage.getItem('reorder_modal_shown') === 'true') {
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/order/last-delivered`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch last delivered order');
        return;
      }

      const result = await response.json();
      
      if (result.success && result.order) {
        setLastDeliveredOrder(result.order);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error checking last delivered order:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Store in sessionStorage so we don't show it again in this session
    sessionStorage.setItem('reorder_modal_shown', 'true');
  };

  return (
    <ReOrderModal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      order={lastDeliveredOrder}
    />
  );
}

