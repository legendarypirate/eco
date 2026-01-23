export interface Product {
  id: string;
  name: string;
  nameMn?: string;
  price: number;
  originalPrice?: number;
  
  // Images - support multiple images
  images: string[];
  thumbnail: string;
  
  // Category info
  category: string;
  subcategory?: string;
  
  // Stock & Availability
  inStock: boolean;
  stockQuantity: number;
  sku: string;
  
  // Product details
  brand?: string;
  description?: string;
  specifications?: Record<string, string>;
  
  // Product status & flags
  isFeatured: boolean;
  isNew: boolean;
  isOnSale: boolean;
  isBestSeller: boolean;
  isLimited: boolean;
  // Pricing & Discount
  discount: number; // Percentage discount (e.g., 20 for 20%)
  discountAmount?: number; // Fixed discount amount
  salePrice?: number; // Calculated sale price
  saleEndDate?: Date | string; // When sale ends
    sales: number; // Percentage discount (e.g., 20 for 20%)

  // Product variations
  variations?: ProductVariation[];
  colorOptions?: ColorOption[];
  sizeOptions?: string[];
  
  // Reviews & Ratings
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  
  // SEO & Analytics
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  
  // Shipping & Logistics
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  
  // Dates
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt?: Date | string;
}

// Supporting interfaces
export interface ProductVariation {
  id: string;
  name: string;
  nameMn: string;
  price: number;
  originalPrice?: number; 
  sku: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  attributes: Record<string, string>; // { color: 'red', size: 'M' }
}

export interface ColorOption {
  name: string;
  nameMn: string;
  value: string; // hex color code
  image?: string; // specific image for this color
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: Date | string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  images?: string[]; // review photos
}

// Optional: For product listing/filtering
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  inStock?: boolean;
  isOnSale?: boolean;
  isNew?: boolean;
  rating?: number;
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popularity';
  search?: string;
}

// Optional: For paginated product responses
export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters?: ProductFilters;
}

// Optional: Simplified version for product cards
export interface ProductCardData {
  id: string;
  nameMn: string;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  categoryMn: string;
  inStock: boolean;
  isNew: boolean;
  isOnSale: boolean;
  rating: number;
  reviewCount: number;
}

export interface Subcategory {
  id: string;
  name: string;
  nameMn: string;
  image?: string;
  description?: string;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  nameMn: string;
  image: string;
  description: string;
  productCount: number;
  parentId?: string | null; // null = top-level category
  subcategories?: Subcategory[]; // Add this line
}
// app/lib/types.ts

// ... existing Product interface ...

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  price: number | string;
  originalPrice?: number | string;
  thumbnail: string;
  quantity: number;
  variation?: ProductVariation;
  selectedSize?: string;
  selectedColor?: string;
  addedAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  price: number | string;
  thumbnail: string;
  variation?: ProductVariation;
  addedAt: string;
}