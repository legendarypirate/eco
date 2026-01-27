"use client";

import { useEffect, useState } from "react";
import { Save, Gift, CheckCircle, XCircle, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Product {
  id: string;
  name: string;
  nameMn?: string;
  sku: string;
  price: number;
  thumbnail?: string;
  is_gift: boolean;
  gift_floor_limit: number | null;
}

export default function GiftSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editedProducts, setEditedProducts] = useState<Record<string, { gift_floor_limit: number | null }>>({});

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch all products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      const response = await fetch(`${API_URL}/products?limit=1000&includeVariations=false`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const productsList = Array.isArray(data) ? data : (data.products || []);
      
      // Map products to include gift fields and filter to only show gift products
      const mappedProducts = productsList
        .filter((product: any) => product.is_gift || product.isGift) // Only show products that are gifts
        .map((product: any) => ({
          id: product.id,
          name: product.name || '',
          nameMn: product.nameMn || '',
          sku: product.sku || '',
          price: parseFloat(product.price) || 0,
          thumbnail: product.thumbnail || product.images?.[0] || '',
          is_gift: product.is_gift || product.isGift || false,
          gift_floor_limit: product.gift_floor_limit || product.giftFloorLimit || null,
        }));

      setProducts(mappedProducts);
      
      // Initialize edited products
      const initialEdited: Record<string, { gift_floor_limit: number | null }> = {};
      mappedProducts.forEach((product: Product) => {
        initialEdited[product.id] = {
          gift_floor_limit: product.gift_floor_limit,
        };
      });
      setEditedProducts(initialEdited);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Update product gift status and floor limit
  const updateProductGift = async (productId: string, isGift: boolean, floorLimit: number | null) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_gift: isGift,
          gift_floor_limit: floorLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  // Save all changes
  const saveAllChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updates = Object.entries(editedProducts)
        .filter(([productId, edited]) => {
          const original = products.find(p => p.id === productId);
          return original && (
            edited.gift_floor_limit !== original.gift_floor_limit
          );
        })
        .map(([productId, edited]) => ({
          productId,
          is_gift: true, // All products in this list are gifts
          gift_floor_limit: edited.gift_floor_limit,
        }));

      if (updates.length === 0) {
        setSuccess('Өөрчлөлт байхгүй байна');
        setTimeout(() => setSuccess(null), 3000);
        setSaving(false);
        return;
      }

      // Update products one by one
      let successCount = 0;
      let errorCount = 0;

      for (const update of updates) {
        try {
          await updateProductGift(update.productId, update.is_gift, update.gift_floor_limit);
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Failed to update product ${update.productId}:`, err);
        }
      }

      if (errorCount === 0) {
        setSuccess(`${successCount} бүтээгдэхүүн амжилттай шинэчлэгдлээ`);
        await fetchProducts(); // Refresh products
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(`${errorCount} бүтээгдэхүүн шинэчлэхэд алдаа гарлаа. ${successCount} амжилттай.`);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };


  // Handle floor limit change
  const handleFloorLimitChange = (productId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        gift_floor_limit: numValue && !isNaN(numValue) && numValue >= 0 ? numValue : null,
      },
    }));
  };

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.nameMn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get gift products count (all products on this page are gifts since they're filtered)
  const giftProductsCount = products.length;

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Бүтээгдэхүүнүүдийг уншиж байна...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Бэлгийн тохиргоо</h1>
          <p className="text-gray-600">Бэлэг бүтээгдэхүүнүүдийн floor limit тохируулах</p>
        </div>
        <Button 
          onClick={saveAllChanges} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Бүх өөрчлөлтийг хадгалах
            </>
          )}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Бэлгийн тохиргооны тайлбар
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Бэлэг бүтээгдэхүүн:</strong> Энэ хуудас дээр зөвхөн бэлэг болгосон бүтээгдэхүүнүүд харагдана. 
              Бүтээгдэхүүнийг бэлэг болгохыг хүсвэл <strong>Бүтээгдэхүүн</strong> хуудас дээр очоод тохируулна уу.
            </p>
            <p>
              <strong>Floor Limit:</strong> Хэрэглэгчийн сагсны нийт дүн энэ утгаас их эсвэл тэнцүү бол, 
              энэ бэлэг бүтээгдэхүүн сагсны хуудас дээр харуулагдана.
            </p>
            <p className="pt-2 text-xs text-gray-600">
              Жишээ: Floor limit 100,000₮ гэж тохируулбал, хэрэглэгч 100,000₮-аас их дүнтэй сагс үүсгэхэд энэ бэлэг бүтээгдэхүүн харуулагдана.
            </p>
            <p className="pt-2 text-sm font-medium text-blue-800">
              Одоогийн бэлэг бүтээгдэхүүн: {giftProductsCount}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Хаах
          </button>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Бүтээгдэхүүн хайх (нэр, SKU)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Бүтээгдэхүүнүүд ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Зураг</TableHead>
                  <TableHead>Нэр</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-32">Үнэ</TableHead>
                  <TableHead className="w-40">Floor Limit (₮)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Бэлэг бүтээгдэхүүн олдсонгүй. Бүтээгдэхүүнийг бэлэг болгохыг хүсвэл <strong>Бүтээгдэхүүн</strong> хуудас дээр очоод тохируулна уу.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const edited = editedProducts[product.id];
                    const floorLimit = edited ? edited.gift_floor_limit : product.gift_floor_limit;
                    const hasChanges = edited && (
                      edited.gift_floor_limit !== product.gift_floor_limit
                    );

                    return (
                      <TableRow 
                        key={product.id}
                        className={hasChanges ? 'bg-yellow-50' : ''}
                      >
                        <TableCell>
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                              <Gift className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.nameMn || product.name}</div>
                            {product.nameMn && product.name !== product.nameMn && (
                              <div className="text-xs text-gray-500">{product.name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{product.sku}</code>
                        </TableCell>
                        <TableCell>
                          {product.price.toLocaleString()}₮
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            value={floorLimit || ''}
                            onChange={(e) => handleFloorLimitChange(product.id, e.target.value)}
                            placeholder="100000"
                            className="w-full"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
