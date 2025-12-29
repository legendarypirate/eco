"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Edit, Truck, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

type OrderItem = {
  name: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  created_at: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  payment_status: "paid" | "unpaid" | "refunded";
  items: OrderItem[];
  total: number;
  customer_name?: string;
  customer_phone?: string;
  address?: string;
};

export default function AdminOrderList() {
  return <OrderPage />;
}

function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/order`;

  // Map backend order status to frontend status
  const mapOrderStatus = (status: number): Order["status"] => {
    switch (status) {
      case 0: return "processing";
      case 1: return "shipped";
      case 2: return "delivered";
      case 3: return "cancelled";
      default: return "pending";
    }
  };

  // Map backend payment status to frontend payment status
  const mapPaymentStatus = (status: number): Order["payment_status"] => {
    switch (status) {
      case 1: return "paid";
      case 3: return "refunded";
      case 0:
      case 2:
      default: return "unpaid";
    }
  };

  // Format date
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/admin/all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.orders) {
        // Transform backend data to frontend format
        const transformedOrders: Order[] = data.orders.map((order: any) => ({
          id: order.order_number || String(order.id),
          created_at: formatDate(order.created_at),
          status: mapOrderStatus(order.order_status),
          payment_status: mapPaymentStatus(order.payment_status),
          items: (order.items || []).map((item: any) => ({
            name: item.name || item.name_mn || "Бараа",
            qty: item.quantity || 1,
            price: parseFloat(item.price) || 0,
          })),
          total: parseFloat(order.grand_total) || 0,
          customer_name: order.customer_name,
          customer_phone: order.phone_number,
          address: order.shipping_address,
        }));
        
        setOrders(transformedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Update order status via API
  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      // Map frontend status to backend status
      const statusMap: Record<Order["status"], number> = {
        pending: 0,
        processing: 0,
        shipped: 1,
        delivered: 2,
        cancelled: 3,
      };

      const backendStatus = statusMap[newStatus];
      
      // Find the original order to get the actual ID
      const originalOrder = orders.find(o => o.id === orderId);
      if (!originalOrder) return;

      // Extract numeric ID from order_number or use a different approach
      // Since we're using order_number as id, we need to find by order_number
      const response = await fetch(`${API_URL}/number/${orderId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to find order');
      }

      const orderData = await response.json();
      const actualOrderId = orderData.order?.id;

      if (!actualOrderId) {
        throw new Error('Order ID not found');
      }

      const updateResponse = await fetch(`${API_URL}/${actualOrderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_status: backendStatus }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update order status');
      }

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  // Update payment status via API
  const updatePaymentStatus = async (orderId: string, newPaymentStatus: Order["payment_status"]) => {
    try {
      // Map frontend payment status to backend status
      const paymentMap: Record<Order["payment_status"], number> = {
        paid: 1,
        unpaid: 0,
        refunded: 3,
      };

      const backendPaymentStatus = paymentMap[newPaymentStatus];
      
      // Find order by order_number
      const response = await fetch(`${API_URL}/number/${orderId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to find order');
      }

      const orderData = await response.json();
      const actualOrderId = orderData.order?.id;

      if (!actualOrderId) {
        throw new Error('Order ID not found');
      }

      const updateResponse = await fetch(`${API_URL}/${actualOrderId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_status: backendPaymentStatus }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update payment status');
      }

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  };

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const paymentColor = {
    paid: "bg-green-100 text-green-700 border-green-200",
    unpaid: "bg-red-100 text-red-700 border-red-200",
    refunded: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const statusOptions = [
    { value: "pending", label: "Хүлээгдэж байна", icon: "⏳" },
    { value: "processing", label: "Боловсруулж байна", icon: "🔄" },
    { value: "shipped", label: "Хүргэлтэнд гарсан", icon: "🚚" },
    { value: "delivered", label: "Хүргэгдсэн", icon: "✅" },
    { value: "cancelled", label: "Цуцлагдсан", icon: "❌" },
  ];

  const paymentOptions = [
    { value: "paid", label: "Төлбөр төлөгдсөн" },
    { value: "unpaid", label: "Төлбөр төлөгдөөгүй" },
    { value: "refunded", label: "Буцаагдсан" },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    // Optimistically update UI
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    // Then update via API
    await updateOrderStatus(orderId, newStatus);
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: Order["payment_status"]) => {
    // Optimistically update UI
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, payment_status: newPaymentStatus } : order
      )
    );
    // Then update via API
    await updatePaymentStatus(orderId, newPaymentStatus);
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "⏳";
      case "processing": return "🔄";
      case "shipped": return "🚚";
      case "delivered": return "✅";
      case "cancelled": return "❌";
      default: return "📦";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Захиалгуудыг уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Захиалгын жагсаалт</h1>
        <div className="text-sm text-gray-500">
          Нийт: {filteredOrders.length} захиалга
        </div>
      </div>

      {/* Error Display */}
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

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Захиалгын дугаар, харилцагчийн нэр, утасны дугаараар хайх..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлөв</SelectItem>
            {statusOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.icon} {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Төлбөрийн төлөв" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төлбөрийн төлөв</SelectItem>
            {paymentOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-6 shadow-sm border">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-lg">#{order.id}</p>
                  <span className={`px-3 py-1 rounded-full text-sm border ${statusColor[order.status]}`}>
                    {getStatusIcon(order.status)} {statusOptions.find(s => s.value === order.status)?.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm border ${paymentColor[order.payment_status]}`}>
                    {paymentOptions.find(p => p.value === order.payment_status)?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Үүссэн: {order.created_at}</p>
                {order.customer_name && (
                  <p className="text-sm">
                    <span className="font-medium">Харилцагч:</span> {order.customer_name} ({order.customer_phone})
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Харах
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditOrder(order)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Засах
                </Button>
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <p className="font-medium mb-2">Бараанууд:</p>
              <ul className="space-y-1 text-sm">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.name} × {item.qty}ш</span>
                    <span className="font-medium">{item.price.toLocaleString()}₮</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-lg font-semibold">
                Нийт: {order.total.toLocaleString()}₮
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Select 
                  value={order.status} 
                  onValueChange={(value: Order["status"]) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.icon} {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  value={order.payment_status} 
                  onValueChange={(value: Order["payment_status"]) => handlePaymentStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-40 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Захиалга олдсонгүй</p>
          </Card>
        )}
      </div>

      {/* View Order Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Захиалгын дэлгэрэнгүй #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Харилцагчийн мэдээлэл</h4>
                  <p>Нэр: {selectedOrder.customer_name}</p>
                  <p>Утас: {selectedOrder.customer_phone}</p>
                  <p>Хаяг: {selectedOrder.address}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Захиалгын мэдээлэл</h4>
                  <p>Үүссэн огноо: {selectedOrder.created_at}</p>
                  <p>Төлөв: {statusOptions.find(s => s.value === selectedOrder.status)?.label}</p>
                  <p>Төлбөрийн төлөв: {paymentOptions.find(p => p.value === selectedOrder.payment_status)?.label}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Захиалгын бараанууд</h4>
                <div className="border rounded-lg">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between p-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Тоо ширхэг: {item.qty}</p>
                      </div>
                      <p className="font-medium">{item.price.toLocaleString()}₮</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right text-xl font-bold border-t pt-4">
                Нийт дүн: {selectedOrder.total.toLocaleString()}₮
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Хаах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Захиалга засах #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Төлөв</label>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(value: Order["status"]) => 
                      setSelectedOrder({...selectedOrder, status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Төлбөрийн төлөв</label>
                  <Select 
                    value={selectedOrder.payment_status} 
                    onValueChange={(value: Order["payment_status"]) => 
                      setSelectedOrder({...selectedOrder, payment_status: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Бараанууд</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex gap-4 items-center p-2 border rounded">
                      <Input
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...selectedOrder.items];
                          newItems[i].name = e.target.value;
                          setSelectedOrder({...selectedOrder, items: newItems});
                        }}
                        placeholder="Барааны нэр"
                      />
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const newItems = [...selectedOrder.items];
                          newItems[i].qty = parseInt(e.target.value) || 0;
                          setSelectedOrder({...selectedOrder, items: newItems});
                        }}
                        className="w-20"
                        placeholder="Тоо"
                      />
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const newItems = [...selectedOrder.items];
                          newItems[i].price = parseInt(e.target.value) || 0;
                          setSelectedOrder({...selectedOrder, items: newItems});
                        }}
                        className="w-32"
                        placeholder="Үнэ"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Цуцлах</Button>
            <Button onClick={async () => {
              if (selectedOrder) {
                // Update status and payment status via API
                await handleStatusChange(selectedOrder.id, selectedOrder.status);
                await handlePaymentStatusChange(selectedOrder.id, selectedOrder.payment_status);
                setIsEditOpen(false);
              }
            }}>Хадгалах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}