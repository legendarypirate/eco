"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type OrderStatus = 'delivered' | 'processing' | 'shipped' | 'pending';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: LucideIcon }> = {
  delivered: { label: 'Хүргэгдсэн', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  processing: { label: 'Боловсруулж байна', color: 'bg-blue-100 text-blue-800', icon: Clock },
  shipped: { label: 'Хүргэлтэнд гарсан', color: 'bg-purple-100 text-purple-800', icon: Package },
  pending: { label: 'Хүлээгдэж байна', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
};

interface DashboardStats {
  totalUsers: number;
  activeOrders: number;
  revenue: number;
  totalProducts: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeOrders: 0,
    revenue: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const mapOrderStatus = (status: number): OrderStatus => {
    // Order status: 0 = Processing, 1 = Shipped, 2 = Delivered, 3 = Cancelled
    if (status === 2) return 'delivered';
    if (status === 1) return 'shipped';
    if (status === 0) return 'processing';
    return 'pending';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('mn-MN');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      // Fetch all data in parallel
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/user/all`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }),
        fetch(`${API_URL}/api/order/admin/all`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }),
        fetch(`${API_URL}/api/products`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }),
      ]);

      // Process users
      let totalUsers = 0;
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        let users: any[] = [];
        
        if (Array.isArray(usersData)) {
          users = usersData;
        } else if (Array.isArray(usersData.users)) {
          users = usersData.users;
        } else if (Array.isArray(usersData.data)) {
          users = usersData.data;
        }
        
        totalUsers = users.length;
      }

      // Process orders
      let activeOrders = 0;
      let pendingOrders = 0;
      let revenue = 0;
      const ordersList: RecentOrder[] = [];
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        let orders: any[] = [];
        
        if (Array.isArray(ordersData)) {
          orders = ordersData;
        } else if (Array.isArray(ordersData.orders)) {
          orders = ordersData.orders;
        } else if (Array.isArray(ordersData.data)) {
          orders = ordersData.data;
        }
        
        activeOrders = orders.filter((o: any) => o.order_status !== 3).length;
        pendingOrders = orders.filter((o: any) => o.order_status === 0).length;
        
        // Calculate revenue from delivered orders
        revenue = orders
          .filter((o: any) => o.order_status === 2 && o.payment_status === 1)
          .reduce((sum: number, o: any) => sum + (parseFloat(o.grand_total) || 0), 0);

        // Get recent orders (last 4)
        const recent = orders
          .slice(0, 4)
          .map((order: any) => ({
            id: order.order_number || String(order.id),
            customer: order.customer_name || 'Хэрэглэгч',
            amount: parseFloat(order.grand_total) || 0,
            status: mapOrderStatus(order.order_status),
            date: order.created_at || new Date().toISOString(),
          }));
        ordersList.push(...recent);
      }

      // Process products
      let totalProducts = 0;
      const productsList: TopProduct[] = [];
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        let products: any[] = [];
        
        if (Array.isArray(productsData)) {
          products = productsData;
        } else if (Array.isArray(productsData.products)) {
          products = productsData.products;
        } else if (Array.isArray(productsData.data)) {
          products = productsData.data;
        }
        
        totalProducts = products.length;

        // Calculate top products from order items
        // This is a simplified version - in a real app, you'd aggregate from order_items table
        // For now, we'll show products with highest stock or most recent
        const sortedProducts = [...products]
          .sort((a: any, b: any) => (b.stock || 0) - (a.stock || 0))
          .slice(0, 4)
          .map((product: any) => ({
            name: product.name_mn || product.name || 'Бараа',
            sales: 0, // Would need to calculate from order_items
            revenue: 0, // Would need to calculate from order_items
          }));
        productsList.push(...sortedProducts);
      }

      setStats({
        totalUsers,
        activeOrders,
        revenue,
        totalProducts,
        pendingOrders,
      });
      setRecentOrders(ordersList);
      setTopProducts(productsList);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Мэдээлэл ачаалж байна...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <Button 
            onClick={fetchDashboardData} 
            variant="outline" 
            className="mt-4"
          >
            Дахин оролдох
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Хянах самбар</h1>
          <p className="text-gray-600">Өнөөдрийн үйл ажиллагааны тойм</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Шинэчлэх
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт хэрэглэгч</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-blue-600">
              Бүртгэлтэй хэрэглэгч
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхтэй захиалга</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeOrders}</div>
            <p className="text-xs text-green-600">
              {stats.pendingOrders} хүлээгдэж байна
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Орлого</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.revenue)}</div>
            <p className="text-xs text-purple-600">
              Хүргэгдсэн захиалгууд
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Барааны тоо</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-orange-600">
              Нийт бараа
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Additional Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Сүүлийн захиалгууд</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/admin/order'}
              >
                Бүгдийг харах
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${statusConfig[order.status].color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{order.id}</div>
                          <div className="text-sm text-gray-500">{order.customer}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(order.amount)}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.date)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Захиалга байхгүй байна
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Бараанууд</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">Бараа</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Бараа байхгүй байна
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Түргэн үйлдлүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="h-16 flex-col gap-1"
                onClick={() => window.location.href = '/admin/order'}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs">Захиалга харах</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={() => window.location.href = '/admin/product'}
              >
                <Package className="h-5 w-5" />
                <span className="text-xs">Бараа нэмэх</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={() => window.location.href = '/admin/users'}
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Хэрэглэгч харах</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col gap-1"
                onClick={() => window.location.href = '/admin/order'}
              >
                <Eye className="h-5 w-5" />
                <span className="text-xs">Тайлан харах</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}