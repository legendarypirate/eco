// app/context/CartContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Product {
  id: string | number;
  name: string;
  nameMn: string;
  price: number;
  originalPrice?: number;
  image: string;
  thumbnail?: string;
  inStock: boolean;
  categoryId?: string;
  category?: string;
  sku?: string;
  // Add other product fields as needed
}

interface CartItem {
  id: string | number;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  addedAt: string;
}

interface AddToCartResult {
  success: boolean;
  message: string;
  alreadyExists: boolean;
}

interface WishlistItem {
  id: string | number;
  product: Product;
  addedAt: string;
}

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  cartCount: number;
  wishlistCount: number;
  cartTotal: number;
  addToCart: (item: CartItem) => AddToCartResult;
  removeFromCart: (id: number | string) => void;
  updateCartItemQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number | string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: number | string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart and wishlist from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        setCartItems([]);
      }
    }
    
    if (savedWishlist) {
      try {
        setWishlistItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error('Error parsing wishlist from localStorage:', error);
        setWishlistItems([]);
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isInitialized]);

  const addToCart = (item: CartItem): AddToCartResult => {
    // Check if item already exists in current cart state BEFORE updating
    // Compare by product ID and variation attributes, not cart item ID
    // since different pages may create different cart item IDs for the same product
    const existingItem = cartItems.find(cartItem => 
      String(cartItem.product.id) === String(item.product.id) && 
      cartItem.selectedSize === item.selectedSize &&
      cartItem.selectedColor === item.selectedColor
    );

    if (existingItem) {
      // Item already exists, don't add it again
      return {
        success: false,
        message: 'энэ бараа сагсанд байна',
        alreadyExists: true
      };
    }

    // Item doesn't exist, add it
    setCartItems(prev => [...prev, item]);

    return {
      success: true,
      message: 'Сагсанд нэмэгдлээ',
      alreadyExists: false
    };
  };

  const removeFromCart = (id: number | string) => {
    const idStr = String(id);
    setCartItems(prev => prev.filter(item => String(item.id) !== idStr));
  };

  const updateCartItemQuantity = (id: number | string, quantity: number) => {
    const idStr = String(id);
    setCartItems(prev =>
      prev.map(item =>
        String(item.id) === idStr ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Wishlist functions
  const toggleWishlist = (product: Product) => {
    setWishlistItems(prev => {
      const productIdStr = String(product.id);
      const isInWishlist = prev.some(item => String(item.id) === productIdStr);
      
      if (isInWishlist) {
        return prev.filter(item => String(item.id) !== productIdStr);
      } else {
        return [...prev, {
          id: product.id,
          product: product,
          addedAt: new Date().toISOString()
        }];
      }
    });
  };

  const addToWishlist = (item: WishlistItem) => {
    setWishlistItems(prev => {
      // Use string comparison for UUIDs
      const itemId = String(item.id);
      
      // Validate item ID
      if (!itemId || itemId === 'NaN' || itemId === 'undefined' || itemId === 'null' || itemId.trim() === '') {
        console.warn('Invalid item ID:', item.id);
        return prev;
      }
      
      // Check if item already exists - compare IDs as strings
      const isInWishlist = prev.some(wishlistItem => {
        const wishlistItemId = String(wishlistItem.id);
        return wishlistItemId === itemId;
      });
      
      if (!isInWishlist) {
        return [...prev, item];
      }
      return prev;
    });
  };

  const removeFromWishlist = (id: number | string) => {
    const idStr = String(id);
    setWishlistItems(prev => prev.filter(item => String(item.id) !== idStr));
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  const isInWishlist = (id: number | string): boolean => {
    const idStr = String(id);
    return wishlistItems.some(item => String(item.id) === idStr);
  };

  // Calculate cart count
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate wishlist count
  const wishlistCount = wishlistItems.length;
  
  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        cartCount,
        wishlistCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};