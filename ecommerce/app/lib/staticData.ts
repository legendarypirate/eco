import { Product, Category, CartItem } from './types';

export const getStaticProducts = (): Product[] => [
  {
    id: '1',
    name: 'Mongolian Cashmere Scarf',
    price: 89900,
    originalPrice: 119900,
    images: [
      '/images/cashmere-scarf-red.jpg',
      '/images/cashmere-scarf-red-2.jpg',
      '/images/cashmere-scarf-red-3.jpg'
    ],
    thumbnail: '/images/cashmere-scarf-red.jpg',
    category: 'clothing',
    subcategory: 'scarves',
    
    // Stock & Availability
    inStock: true,
    stockQuantity: 50,
    sku: 'CASH-SCARF-001',
    
    // Product details
    brand: 'Mongolian Cashmere',
    description: 'Premium Mongolian cashmere scarf made from the finest goat wool',
    specifications: {
      'Material': '100% Mongolian Cashmere',
      'Dimensions': '180cm x 60cm',
      'Weight': '200g',
      'Care': 'Hand wash cold, dry flat'
    },
   
    // Product status & flags
    isFeatured: true,
    isNew: true,
    isOnSale: true,
    isBestSeller: true,
    isLimited: false,
    
    // Pricing & Discount
    discount: 25,
    discountAmount: 30000,
    salePrice: 89900,
    saleEndDate: '2024-12-31T23:59:59Z',
    sales: 25,
    
    // Product variations
    variations: [
      {
        id: '1-1',
        name: 'Mongolian Cashmere Scarf - Red',
        nameMn: 'Монгол Кашмир Ороолт - Улаан',
        price: 89900,
        originalPrice: 119900,
        sku: 'CASH-SCARF-RED',
        images: [
          '/images/cashmere-scarf-red.jpg',
          '/images/cashmere-scarf-red-2.jpg'
        ],
        inStock: true,
        stockQuantity: 20,
        attributes: {
          color: 'red',
          size: 'standard'
        }
      },
      {
        id: '1-2',
        name: 'Mongolian Cashmere Scarf - Blue',
        nameMn: 'Монгол Кашмир Ороолт - Цэнхэр',
        price: 89900,
        originalPrice: 119900,
        sku: 'CASH-SCARF-BLUE',
        images: [
          '/images/cashmere-scarf-blue.jpg',
          '/images/cashmere-scarf-blue-2.jpg'
        ],
        inStock: true,
        stockQuantity: 15,
        attributes: {
          color: 'blue',
          size: 'standard'
        }
      },
      {
        id: '1-3',
        name: 'Mongolian Cashmere Scarf - Beige',
        nameMn: 'Монгол Кашмир Ороолт - Шаргал',
        price: 89900,
        originalPrice: 119900,
        sku: 'CASH-SCARF-BEIGE',
        images: [
          '/images/cashmere-scarf-beige.jpg',
          '/images/cashmere-scarf-beige-2.jpg'
        ],
        inStock: false,
        stockQuantity: 0,
        attributes: {
          color: 'beige',
          size: 'standard'
        }
      }
    ],
    
    colorOptions: [
      {
        name: 'Red',
        nameMn: 'Улаан',
        value: '#ff0000',
        image: '/images/cashmere-scarf-red.jpg'
      },
      {
        name: 'Blue',
        nameMn: 'Цэнхэр',
        value: '#0000ff',
        image: '/images/cashmere-scarf-blue.jpg'
      },
      {
        name: 'Beige',
        nameMn: 'Шаргал',
        value: '#f5f5dc',
        image: '/images/cashmere-scarf-beige.jpg'
      }
    ],
    
    sizeOptions: ['standard', 'large', 'extra-large'],
    
    // Reviews & Ratings
    rating: 4.8,
    reviewCount: 128,
    reviews: [
      {
        id: 'rev-1',
        userId: 'user123',
        userName: 'Bat Bold',
        rating: 5,
        title: 'Excellent quality!',
        comment: 'Very warm and soft, perfect for Mongolian winter',
        createdAt: '2024-02-15T10:30:00Z',
        verifiedPurchase: true,
        helpfulCount: 12,
        images: ['/images/review-scarf-1.jpg']
      },
      {
        id: 'rev-2',
        userId: 'user456',
        userName: 'Saraa Gantulga',
        rating: 4,
        title: 'Beautiful scarf',
        comment: 'Love the color and texture, slightly thinner than expected',
        createdAt: '2024-03-20T14:45:00Z',
        verifiedPurchase: true,
        helpfulCount: 5
      }
    ],
    
    // SEO & Analytics
    slug: 'mongolian-cashmere-scarf',
    metaTitle: 'Premium Mongolian Cashmere Scarf | Traditional Winter Accessory',
    metaDescription: 'Authentic Mongolian cashmere scarf, handmade from finest goat wool. Perfect for cold weather.',
    tags: ['cashmere', 'premium', 'winter', 'scarf', 'traditional'],
    
    // Shipping & Logistics
    weight: 200,
    dimensions: {
      length: 180,
      width: 60,
      height: 2
    },
    
    // Dates
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-12-01T14:20:00Z',
    publishedAt: '2024-01-20T09:00:00Z'
  },
  {
    id: '2',
    name: 'Mongolian Leather Boots',
    price: 129900,
    originalPrice: 159900,
    images: [
      '/images/leather-boots-brown.jpg',
      '/images/leather-boots-brown-2.jpg',
      '/images/leather-boots-brown-3.jpg'
    ],
    thumbnail: '/images/leather-boots-brown.jpg',
    category: 'footwear',
    subcategory: 'boots',
    
    // Stock & Availability
    inStock: true,
    stockQuantity: 35,
    sku: 'LEATH-BOOT-001',
    
    // Product details
    brand: 'Mongolian Heritage',
    description: 'Traditional Mongolian leather boots with authentic design',
    specifications: {
      'Material': '100% Genuine Leather',
      'Lining': 'Wool felt',
      'Sole': 'Rubber',
      'Closure': 'Lace-up',
      'Height': 'Ankle'
    },
    
    // Product status & flags
    isFeatured: true,
    isNew: false,
    isOnSale: true,
    isBestSeller: true,
    isLimited: false,
    
    // Pricing & Discount
    discount: 19,
    discountAmount: 30000,
    salePrice: 129900,
    saleEndDate: '2024-12-31T23:59:59Z',
    sales: 19,
    
    // Product variations
    variations: [
      {
        id: '2-1',
        name: 'Mongolian Leather Boots - Brown Size 40',
        nameMn: 'Монгол Арьсан Гутал - Бор 40',
        price: 129900,
        originalPrice: 159900,
        sku: 'BOOT-BROWN-40',
        images: ['/images/leather-boots-brown-40.jpg'],
        inStock: true,
        stockQuantity: 10,
        attributes: {
          color: 'brown',
          size: '40'
        }
      },
      {
        id: '2-2',
        name: 'Mongolian Leather Boots - Brown Size 41',
        nameMn: 'Монгол Арьсан Гутал - Бор 41',
        price: 129900,
        originalPrice: 159900,
        sku: 'BOOT-BROWN-41',
        images: ['/images/leather-boots-brown-41.jpg'],
        inStock: true,
        stockQuantity: 8,
        attributes: {
          color: 'brown',
          size: '41'
        }
      },
      {
        id: '2-3',
        name: 'Mongolian Leather Boots - Black Size 40',
        nameMn: 'Монгол Арьсан Гутал - Хар 40',
        price: 129900,
        originalPrice: 159900,
        sku: 'BOOT-BLACK-40',
        images: ['/images/leather-boots-black-40.jpg'],
        inStock: true,
        stockQuantity: 7,
        attributes: {
          color: 'black',
          size: '40'
        }
      }
    ],
    
    colorOptions: [
      {
        name: 'Brown',
        nameMn: 'Бор',
        value: '#8B4513',
        image: '/images/leather-boots-brown.jpg'
      },
      {
        name: 'Black',
        nameMn: 'Хар',
        value: '#000000',
        image: '/images/leather-boots-black.jpg'
      }
    ],
    
    sizeOptions: ['38', '39', '40', '41', '42', '43'],
    
    // Reviews & Ratings
    rating: 4.7,
    reviewCount: 89,
    reviews: [
      {
        id: 'rev-3',
        userId: 'user789',
        userName: 'Temuujin B',
        rating: 5,
        title: 'Excellent craftsmanship',
        comment: 'Authentic Mongolian boots, very comfortable and durable',
        createdAt: '2024-10-05T11:20:00Z',
        verifiedPurchase: true,
        helpfulCount: 15
      }
    ],
    
    // SEO & Analytics
    slug: 'mongolian-leather-boots',
    metaTitle: 'Traditional Mongolian Leather Boots | Handmade Footwear',
    metaDescription: 'Authentic Mongolian leather boots, handmade with traditional techniques',
    tags: ['leather', 'boots', 'traditional', 'footwear', 'handmade'],
    
    // Shipping & Logistics
    weight: 1200,
    dimensions: {
      length: 30,
      width: 12,
      height: 20
    },
    
    // Dates
    createdAt: '2024-02-10T09:15:00Z',
    updatedAt: '2024-11-25T16:40:00Z',
    publishedAt: '2024-02-15T10:00:00Z'
  },
  {
    id: '3',
    name: 'Mongolian Deel',
    price: 249900,
    originalPrice: 299900,
    images: [
      '/images/mongolian-deel-blue.jpg',
      '/images/mongolian-deel-blue-2.jpg',
      '/images/mongolian-deel-blue-3.jpg'
    ],
    thumbnail: '/images/mongolian-deel-blue.jpg',
    category: 'clothing',
    subcategory: 'deels',
    
    // Stock & Availability
    inStock: true,
    stockQuantity: 25,
    sku: 'DEEL-BLUE-001',
    
    // Product details
    brand: 'Mongolian Tradition',
    description: 'Traditional Mongolian deel robe with intricate patterns',
    specifications: {
      'Material': 'Silk blend',
      'Lining': 'Cotton',
      'Closure': 'Right side',
      'Occasion': 'Ceremonial, Daily wear'
    },
   
    // Product status & flags
    isFeatured: true,
    isNew: true,
    isOnSale: true,
    isBestSeller: true,
    isLimited: true,
    
    // Pricing & Discount
    discount: 17,
    discountAmount: 50000,
    salePrice: 249900,
    saleEndDate: '2024-12-25T23:59:59Z',
    sales: 17,
    
    // Product variations
    variations: [
      {
        id: '3-1',
        name: 'Mongolian Deel - Blue Size M',
        nameMn: 'Монгол Дээл - Цэнхэр M',
        price: 249900,
        originalPrice: 299900,
        sku: 'DEEL-BLUE-M',
        images: ['/images/mongolian-deel-blue-m.jpg'],
        inStock: true,
        stockQuantity: 8,
        attributes: {
          color: 'blue',
          size: 'M'
        }
      },
      {
        id: '3-2',
        name: 'Mongolian Deel - Blue Size L',
        nameMn: 'Монгол Дээл - Цэнхэр L',
        price: 249900,
        originalPrice: 299900,
        sku: 'DEEL-BLUE-L',
        images: ['/images/mongolian-deel-blue-l.jpg'],
        inStock: true,
        stockQuantity: 6,
        attributes: {
          color: 'blue',
          size: 'L'
        }
      },
      {
        id: '3-3',
        name: 'Mongolian Deel - Red Size M',
        nameMn: 'Монгол Дээл - Улаан M',
        price: 249900,
        originalPrice: 299900,
        sku: 'DEEL-RED-M',
        images: ['/images/mongolian-deel-red-m.jpg'],
        inStock: true,
        stockQuantity: 5,
        attributes: {
          color: 'red',
          size: 'M'
        }
      }
    ],
    
    colorOptions: [
      {
        name: 'Blue',
        nameMn: 'Цэнхэр',
        value: '#0000ff',
        image: '/images/mongolian-deel-blue.jpg'
      },
      {
        name: 'Red',
        nameMn: 'Улаан',
        value: '#ff0000',
        image: '/images/mongolian-deel-red.jpg'
      },
      {
        name: 'Gold',
        nameMn: 'Алт',
        value: '#ffd700',
        image: '/images/mongolian-deel-gold.jpg'
      }
    ],
    
    sizeOptions: ['S', 'M', 'L', 'XL'],
    
    // Reviews & Ratings
    rating: 4.9,
    reviewCount: 67,
    reviews: [
      {
        id: 'rev-4',
        userId: 'user999',
        userName: 'Altantsetseg B',
        rating: 5,
        title: 'Perfect for Naadam',
        comment: 'Beautiful deel, wore it during Naadam festival. Great quality!',
        createdAt: '2024-07-15T14:30:00Z',
        verifiedPurchase: true,
        helpfulCount: 22
      }
    ],
    
    // SEO & Analytics
    slug: 'mongolian-deel',
    metaTitle: 'Traditional Mongolian Deel | Authentic Cultural Robe',
    metaDescription: 'Handmade Mongolian deel robe with traditional patterns',
    tags: ['deel', 'traditional', 'robe', 'ceremonial', 'mongolian'],
    
    // Shipping & Logistics
    weight: 1500,
    dimensions: {
      length: 140,
      width: 60,
      height: 5
    },
    
    // Dates
    createdAt: '2024-03-05T08:45:00Z',
    updatedAt: '2024-11-30T10:15:00Z',
    publishedAt: '2024-03-10T09:00:00Z'
  },
  {
    id: '4',
    name: 'Cashmere Sweater',
    price: 189900,
    originalPrice: 229900,
    images: [
      '/images/cashmere-sweater-grey.jpg',
      '/images/cashmere-sweater-grey-2.jpg'
    ],
    thumbnail: '/images/cashmere-sweater-grey.jpg',
    category: 'clothing',
    subcategory: 'sweaters',
    
    // Stock & Availability
    inStock: true,
    stockQuantity: 42,
    sku: 'CASH-SWTR-001',
    
    // Product details
    brand: 'Gobi Cashmere',
    description: 'Luxurious 100% Mongolian cashmere sweater',
    specifications: {
      'Material': '100% Mongolian Cashmere',
      'Weight': 'Lightweight',
      'Care': 'Dry clean recommended',
      'Style': 'Crew neck'
    },
    
    // Product status & flags
    isFeatured: true,
    isNew: true,
    isOnSale: true,
    isBestSeller: false,
    isLimited: true,
    
    // Pricing & Discount
    discount: 17,
    discountAmount: 40000,
    salePrice: 189900,
    saleEndDate: '2024-12-31T23:59:59Z',
    sales: 17,
    
    // Product variations
    variations: [
      {
        id: '4-1',
        name: 'Cashmere Sweater - Grey M',
        nameMn: 'Кашмир Цамц - Саарал M',
        price: 189900,
        originalPrice: 229900,
        sku: 'SWTR-GREY-M',
        images: ['/images/cashmere-sweater-grey-m.jpg'],
        inStock: true,
        stockQuantity: 15,
        attributes: {
          color: 'grey',
          size: 'M'
        }
      },
      {
        id: '4-2',
        name: 'Cashmere Sweater - Grey L',
        nameMn: 'Кашмир Цамц - Саарал L',
        price: 189900,
        originalPrice: 229900,
        sku: 'SWTR-GREY-L',
        images: ['/images/cashmere-sweater-grey-l.jpg'],
        inStock: true,
        stockQuantity: 12,
        attributes: {
          color: 'grey',
          size: 'L'
        }
      },
      {
        id: '4-3',
        name: 'Cashmere Sweater - Cream M',
        nameMn: 'Кашмир Цамц - Цагаан M',
        price: 189900,
        originalPrice: 229900,
        sku: 'SWTR-CREAM-M',
        images: ['/images/cashmere-sweater-cream-m.jpg'],
        inStock: false,
        stockQuantity: 0,
        attributes: {
          color: 'cream',
          size: 'M'
        }
      }
    ],
    
    colorOptions: [
      {
        name: 'Grey',
        nameMn: 'Саарал',
        value: '#808080',
        image: '/images/cashmere-sweater-grey.jpg'
      },
      {
        name: 'Cream',
        nameMn: 'Цагаан',
        value: '#fffdd0',
        image: '/images/cashmere-sweater-cream.jpg'
      },
      {
        name: 'Navy',
        nameMn: 'Хар хөх',
        value: '#000080',
        image: '/images/cashmere-sweater-navy.jpg'
      }
    ],
    
    sizeOptions: ['XS', 'S', 'M', 'L', 'XL'],
    
    // Reviews & Ratings
    rating: 4.9,
    reviewCount: 156,
    reviews: [
      {
        id: 'rev-5',
        userId: 'user789',
        userName: 'Temuujin B',
        rating: 5,
        comment: 'Extremely soft and warm. Worth every penny!',
        createdAt: '2024-11-05T08:20:00Z',
        verifiedPurchase: true,
        helpfulCount: 28
      }
    ],
    
    // SEO & Analytics
    slug: 'cashmere-sweater',
    metaTitle: 'Premium Mongolian Cashmere Sweater | Luxury Winter Wear',
    metaDescription: '100% Mongolian cashmere sweater, ultra soft and warm',
    tags: ['cashmere', 'sweater', 'premium', 'winter', 'luxury'],
    
    // Shipping & Logistics
    weight: 450,
    dimensions: {
      length: 70,
      width: 50,
      height: 3
    },
    
    // Dates
    createdAt: '2024-04-10T11:30:00Z',
    updatedAt: '2024-12-02T09:45:00Z',
    publishedAt: '2024-04-15T10:00:00Z'
  },
  {
    id: '5',
    name: 'Mongolian Silver Jewelry Set',
    price: 189900,
    originalPrice: 219900,
    images: [
      '/images/silver-jewelry-set.jpg',
      '/images/silver-jewelry-set-2.jpg'
    ],
    thumbnail: '/images/silver-jewelry-set.jpg',
    category: 'accessories',
    subcategory: 'jewelry',
    
    // Stock & Availability
    inStock: true,
    stockQuantity: 18,
    sku: 'SILVER-JWL-001',
    
    // Product details
    brand: 'Mongolian Silvercraft',
    description: 'Traditional Mongolian silver jewelry set with turquoise',
    
    // Product status & flags
    isFeatured: true,
    isNew: false,
    isOnSale: true,
    isBestSeller: true,
    isLimited: true,
    
    // Pricing & Discount
    discount: 14,
    discountAmount: 30000,
    salePrice: 189900,
    saleEndDate: '2024-12-20T23:59:59Z',
    sales: 14,
    
    // Reviews & Ratings
    rating: 4.6,
    reviewCount: 45,
    reviews: [],
    
    // SEO & Analytics
    slug: 'mongolian-silver-jewelry-set',
    metaTitle: 'Traditional Mongolian Silver Jewelry | Turquoise Set',
    metaDescription: 'Handcrafted silver jewelry set with genuine turquoise stones',
    tags: ['silver', 'jewelry', 'traditional', 'turquoise', 'accessories'],
    
    // Shipping & Logistics
    weight: 150,
    dimensions: {
      length: 15,
      width: 10,
      height: 5
    },
    
    // Dates
    createdAt: '2024-05-20T14:00:00Z',
    updatedAt: '2024-11-28T13:20:00Z',
    publishedAt: '2024-05-25T10:00:00Z'
  }
];

export const getStaticCategories = (): Category[] => [
  {
    id: '1',
    name: 'Clothing',
    nameMn: 'Хувцас',
    image: '/images/clothing.jpg',
    description: 'Traditional and modern Mongolian clothing',
    productCount: 45,
    subcategories: [
      {
        id: '1-1',
        name: 'Deels',
        nameMn: 'Дээл',
        image: '/images/deels.jpg',
        description: 'Traditional Mongolian robes',
        productCount: 12
      },
      {
        id: '1-2',
        name: 'Cashmere',
        nameMn: 'Кашмир',
        image: '/images/cashmere.jpg',
        description: 'Premium cashmere products',
        productCount: 18
      },
      {
        id: '1-3',
        name: 'Boots',
        nameMn: 'Гутал',
        image: '/images/boots.jpg',
        description: 'Traditional footwear',
        productCount: 8
      },
      {
        id: '1-4',
        name: 'Sweaters',
        nameMn: 'Цамц',
        image: '/images/sweaters.jpg',
        description: 'Wool and cashmere sweaters',
        productCount: 7
      }
    ]
  },
  {
    id: '2',
    name: 'Accessories',
    nameMn: 'Аксессуар',
    image: '/images/accessories.jpg',
    description: 'Traditional Mongolian accessories',
    productCount: 32,
    subcategories: [
      {
        id: '2-1',
        name: 'Jewelry',
        nameMn: 'Үнэт эдлэл',
        image: '/images/jewelry.jpg',
        description: 'Silver and stone jewelry',
        productCount: 15
      },
      {
        id: '2-2',
        name: 'Bags',
        nameMn: 'Цүнх',
        image: '/images/bags.jpg',
        description: 'Leather bags and pouches',
        productCount: 10
      },
      {
        id: '2-3',
        name: 'Scarves',
        nameMn: 'Ороолт',
        image: '/images/scarves.jpg',
        description: 'Cashmere and wool scarves',
        productCount: 7
      }
    ]
  },
  {
    id: '3',
    name: 'Home & Decor',
    nameMn: 'Гэр Ахуй',
    image: '/images/home-decor.jpg',
    description: 'Mongolian home decor items',
    productCount: 28,
    subcategories: [
      {
        id: '3-1',
        name: 'Felt Products',
        nameMn: 'Эсгий',
        image: '/images/felt-products.jpg',
        description: 'Felt carpets and decorations',
        productCount: 12
      },
      {
        id: '3-2',
        name: 'Wood Carvings',
        nameMn: 'Модон сийлбэр',
        image: '/images/wood-carvings.jpg',
        description: 'Traditional wooden carvings',
        productCount: 8
      },
      {
        id: '3-3',
        name: 'Ceramics',
        nameMn: 'Шавраар хийсэн',
        image: '/images/ceramics.jpg',
        description: 'Traditional pottery and ceramics',
        productCount: 8
      }
    ]
  },
  {
    id: '4',
    name: 'Traditional',
    nameMn: 'Уламжлалт',
    image: '/images/traditional.jpg',
    description: 'Authentic Mongolian traditional items',
    productCount: 22,
    subcategories: [
      {
        id: '4-1',
        name: 'Musical Instruments',
        nameMn: 'Хөгжим',
        image: '/images/instruments.jpg',
        description: 'Traditional instruments',
        productCount: 6
      },
      {
        id: '4-2',
        name: 'Utensils',
        nameMn: 'Хэрэгсэл',
        image: '/images/utensils.jpg',
        description: 'Traditional kitchen and dining items',
        productCount: 10
      },
      {
        id: '4-3',
        name: 'Art',
        nameMn: 'Урлаг',
        image: '/images/art.jpg',
        description: 'Traditional Mongolian art',
        productCount: 6
      }
    ]
  }
];

// Sample cart items


// Helper functions
export const getProductById = (id: string): Product | undefined => {
  return getStaticProducts().find(product => product.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
  const category = getStaticCategories().find(c => c.id === categoryId);
  if (!category) return [];
  
  return getStaticProducts().filter(product => 
    product.category.toLowerCase().includes(category.name.toLowerCase()) 
  );
};

export const getFeaturedProducts = (): Product[] => {
  return getStaticProducts().filter(product => product.isFeatured);
};

export const getOnSaleProducts = (): Product[] => {
  return getStaticProducts().filter(product => product.isOnSale);
};