import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Eye,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type OrderStatus = 'delivered' | 'processing' | 'shipped' | 'pending';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: LucideIcon }> = {
  delivered: { label: 'Хүргэгдсэн', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  processing: { label: 'Боловсруулж байна', color: 'bg-blue-100 text-blue-800', icon: Clock },
  shipped: { label: 'Хүргэлтэнд гарсан', color: 'bg-purple-100 text-purple-800', icon: Package },
  pending: { label: 'Хүлээгдэж байна', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
};

// Sample data
const dashboardData = {
  stats: {
    totalUsers: 128,
    activeOrders: 52,
    revenue: 4230000,
    totalProducts: 89,
    newCustomers: 12,
    pendingOrders: 8
  },
  recentOrders: [
    { id: 'ORD-1001', customer: 'Бат', amount: 150000, status: 'delivered' as OrderStatus, date: '2024-01-15' },
    { id: 'ORD-1002', customer: 'Сараа', amount: 75000, status: 'processing' as OrderStatus, date: '2024-01-15' },
    { id: 'ORD-1003', customer: 'Төгс', amount: 420000, status: 'shipped' as OrderStatus, date: '2024-01-14' },
    { id: 'ORD-1004', customer: 'Болд', amount: 89000, status: 'pending' as OrderStatus, date: '2024-01-14' },
  ],
  topProducts: [
    { name: 'iPhone 15 Pro', sales: 45, revenue: 67500000 },
    { name: 'Samsung S24 Ultra', sales: 32, revenue: 48000000 },
    { name: 'AirPods Pro 2', sales: 28, revenue: 8400000 },
    { name: 'MacBook Air M2', sales: 18, revenue: 27000000 },
  ],
  userActivity: [
    { action: 'Бүртгүүлсэн', user: 'Энхжин', time: '2 мин' },
    { action: 'Захиалга үүсгэсэн', user: 'Бат', time: '5 мин' },
    { action: 'Төлбөр төлсөн', user: 'Сараа', time: '12 мин' },
    { action: 'Бараа нэмсэн', user: 'Admin', time: '25 мин' },
  ]
};

export default function AdminHome() {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Хянах самбар</h1>
          <p className="text-gray-600">Өнөөдрийн үйл ажиллагааны тойм</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Өдөр</Button>
          <Button variant="outline">7 хоног</Button>
          <Button variant="default">Сар</Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт хэрэглэгч</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalUsers}</div>
            <p className="text-xs text-blue-600">
              +{dashboardData.stats.newCustomers} шинэ хэрэглэгч
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхтэй захиалга</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeOrders}</div>
            <p className="text-xs text-green-600">
              {dashboardData.stats.pendingOrders} хүлээгдэж байна
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Орлого</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(dashboardData.stats.revenue)}</div>
            <p className="text-xs text-purple-600">
              +12% өмнөх сараас
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Барааны тоо</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalProducts}</div>
            <p className="text-xs text-orange-600">
              5 шинэ бараа нэмэгдсэн
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Additional Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Сүүлийн захиалгууд</span>
              <Button variant="ghost" size="sm">
                Бүгдийг харах
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentOrders.map((order) => {
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
                        {new Date(order.date).toLocaleDateString('mn-MN')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Сүүлийн үйлдлүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.userActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium">{activity.user}</div>
                    <div className="text-sm text-gray-600">{activity.action}</div>
                    <div className="text-xs text-gray-400">{activity.time} өмнө</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Чансааны бараанууд</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sales} борлуулалт</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatPrice(product.revenue)}</div>
                    <div className="text-sm text-green-600">+{Math.floor(Math.random() * 20) + 5}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Түргэн үйлдлүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-16 flex-col gap-1">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs">Захиалга үүсгэх</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <Package className="h-5 w-5" />
                <span className="text-xs">Бараа нэмэх</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <Users className="h-5 w-5" />
                <span className="text-xs">Хэрэглэгч нэмэх</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col gap-1">
                <Eye className="h-5 w-5" />
                <span className="text-xs">Тайлан харах</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Системийн төлөв</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Дэлгүүр</div>
              <div className="text-sm text-green-600">Идэвхтэй</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Төлбөрийн систем</div>
              <div className="text-sm text-green-600">Ажиллаж байна</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold">Сервер</div>
              <div className="text-sm text-green-600">Хэвийн</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="font-semibold">Нөөц</div>
              <div className="text-sm text-yellow-600">75% ашиглагдсан</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}