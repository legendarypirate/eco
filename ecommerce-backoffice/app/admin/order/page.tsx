"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Search, Eye, Edit, Truck, CheckCircle, XCircle, Printer, Trash2, ChevronLeft, ChevronRight, QrCode, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";

type OrderItem = {
  id?: number;
  name: string;
  qty: number;
  price: number;
  productId?: string;
  nameMn?: string;
  image?: string;
  sku?: string;
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
  district?: string;
  khoroo?: string;
  notes?: string;
  invoice_name?: string;
  invoice_register?: string;
  invoice_email?: string;
  invoice_phone?: string;
  invoice_id?: string;
  payment_method?: number;
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Date filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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

  // Parse address components from shipping_address string
  const parseAddressComponents = (shippingAddress: string) => {
    if (!shippingAddress || shippingAddress === 'Ирж авах') {
      return {
        city: '',
        district: '',
        khoroo: '',
        address: shippingAddress || ''
      };
    }

    const addressParts = shippingAddress.split(',').map(part => part.trim());
    
    let city = '';
    let district = '';
    let khoroo = '';
    let address = '';

    // First part is usually the city
    if (addressParts.length > 0) {
      city = addressParts[0];
    }

    // Find district (Дүүрэг: ...)
    const districtIndex = addressParts.findIndex(part => part.startsWith('Дүүрэг:'));
    if (districtIndex !== -1) {
      district = addressParts[districtIndex].replace('Дүүрэг:', '').trim();
    }

    // Find khoroo (Хороо: ...)
    const khorooIndex = addressParts.findIndex(part => part.startsWith('Хороо:'));
    if (khorooIndex !== -1) {
      khoroo = addressParts[khorooIndex].replace('Хороо:', '').trim();
    }

    // Everything after district/khoroo is the detailed address
    const addressStartIndex = Math.max(
      districtIndex !== -1 ? districtIndex + 1 : 0,
      khorooIndex !== -1 ? khorooIndex + 1 : 0,
      1 // At least start from index 1 (after city)
    );
    
    if (addressParts.length > addressStartIndex) {
      address = addressParts.slice(addressStartIndex).join(', ').trim();
    } else {
      // Fallback: if no detailed address found, use the full string minus city/district/khoroo
      address = shippingAddress;
    }

    return { city, district, khoroo, address };
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }
      if (statusFilter !== 'all') {
        // Map frontend status to backend status
        // Note: "pending" doesn't exist in backend, it's treated as "processing" (0)
        const statusMap: Record<string, number> = {
          pending: 0, // Backend doesn't have pending, treat as processing
          processing: 0,
          shipped: 1,
          delivered: 2,
          cancelled: 3,
        };
        const backendStatus = statusMap[statusFilter];
        if (backendStatus !== undefined) {
          params.append('order_status', backendStatus.toString());
        }
      }
      if (paymentFilter !== 'all') {
        // Map frontend payment status to backend status
        const paymentMap: Record<string, number> = {
          paid: 1,
          unpaid: 0,
          refunded: 3,
        };
        params.append('payment_status', paymentMap[paymentFilter]?.toString() || '');
      }
      
      const response = await fetch(`${API_URL}/admin/all?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.orders) {
        // Transform backend data to frontend format
        const transformedOrders: Order[] = data.orders.map((order: any) => {
          const addressComponents = parseAddressComponents(order.shipping_address || '');
          
          // Parse invoice_data if it exists
          let invoiceData = null;
          if (order.invoice_data) {
            try {
              invoiceData = typeof order.invoice_data === 'string' 
                ? JSON.parse(order.invoice_data) 
                : order.invoice_data;
            } catch (e) {
              console.error('Error parsing invoice_data:', e);
            }
          }
          
          return {
            id: order.order_number || String(order.id),
            created_at: formatDate(order.created_at),
            status: mapOrderStatus(order.order_status),
            payment_status: mapPaymentStatus(order.payment_status),
            items: (order.items || []).map((item: any) => ({
              id: item.id,
              name: item.name || item.name_mn || "Бараа",
              qty: item.quantity || 1,
              price: parseFloat(item.price) || 0,
              productId: item.product_id,
              nameMn: item.name_mn,
              image: item.image,
              sku: item.sku,
            })),
            total: parseFloat(order.grand_total) || 0,
            customer_name: order.customer_name,
            customer_phone: order.phone_number,
            address: addressComponents.address,
            // Use database fields first, fallback to parsed values
            district: order.district || addressComponents.district || null,
            khoroo: order.khoroo || addressComponents.khoroo || null,
            notes: order.notes || null,
            invoice_id: order.invoice_id || null,
            payment_method: order.payment_method !== undefined ? order.payment_method : null,
            // Invoice data
            invoice_name: invoiceData?.name || null,
            invoice_register: invoiceData?.register || null,
            invoice_email: invoiceData?.email || null,
            invoice_phone: invoiceData?.phone || null,
          };
        });
        
        setOrders(transformedOrders);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setOrders([]);
        setTotal(0);
        setTotalPages(1);
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

  // Update all order fields via API
  const updateOrder = async (order: Order) => {
    try {
      // Map frontend status to backend status
      const statusMap: Record<Order["status"], number> = {
        pending: 0,
        processing: 0,
        shipped: 1,
        delivered: 2,
        cancelled: 3,
      };

      const paymentMap: Record<Order["payment_status"], number> = {
        paid: 1,
        unpaid: 0,
        refunded: 3,
      };

      // Find order by order_number to get actual ID
      const response = await fetch(`${API_URL}/number/${order.id}`, {
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

      // Build shipping address from components
      let shippingAddress = order.address || '';
      if (order.district || order.khoroo) {
        const parts = [];
        if (order.district) parts.push(`Дүүрэг: ${order.district}`);
        if (order.khoroo) parts.push(`Хороо: ${order.khoroo}`);
        if (order.address) parts.push(order.address);
        shippingAddress = parts.join(', ');
      }

      // Prepare invoice data if any invoice fields are present
      let invoiceData = null;
      if (order.invoice_name || order.invoice_register || order.invoice_email || order.invoice_phone) {
        invoiceData = {
          name: order.invoice_name || '',
          register: order.invoice_register || '',
          email: order.invoice_email || '',
          phone: order.invoice_phone || '',
        };
      }

      // Prepare update payload
      const updatePayload: any = {
        order_status: statusMap[order.status],
        payment_status: paymentMap[order.payment_status],
        customer_name: order.customer_name || '',
        phone_number: order.customer_phone || '',
        shipping_address: shippingAddress,
        district: order.district || null,
        khoroo: order.khoroo || null,
        notes: order.notes || null,
        items: order.items.map(item => ({
          id: item.id,
          name: item.name,
          nameMn: item.nameMn || item.name,
          price: item.price,
          quantity: item.qty,
          productId: item.productId || '',
          image: item.image,
          sku: item.sku,
        })),
      };

      // Add invoice_data if present
      if (invoiceData) {
        updatePayload.invoiceData = invoiceData;
      }

      const updateResponse = await fetch(`${API_URL}/${actualOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update order');
      }

      // Refresh orders after update
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
      throw err;
    }
  };

  // Reset to page 1 when filters change (except currentPage and pageSize)
  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter, paymentFilter]);
  
  // Fetch orders when pagination or filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, startDate, endDate, statusFilter, paymentFilter]);
  
  // Reset to page 1 when search term changes
  useEffect(() => {
    if (currentPage === 1) {
      fetchOrders();
    } else {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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

  // Client-side search filtering (status and payment filters are now server-side)
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    return (
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm)
    );
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditOpen(true);
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      // First, find the order by order_number to get the actual ID
      const findResponse = await fetch(`${API_URL}/number/${orderToDelete.id}`, {
        method: 'GET',
      });

      if (!findResponse.ok) {
        throw new Error('Failed to find order');
      }

      const orderData = await findResponse.json();
      const actualOrderId = orderData.order?.id;

      if (!actualOrderId) {
        throw new Error('Order ID not found');
      }

      // Delete the order
      const deleteResponse = await fetch(`${API_URL}/${actualOrderId}`, {
        method: 'DELETE',
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete order');
      }

      // Refresh orders after deletion
      await fetchOrders();
      setIsDeleteOpen(false);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Error deleting order:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  const handlePrintOrder = (order: Order) => {
    // Create print-friendly HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Захиалгын дэлгэрэнгүй - #${order.id}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .order-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section h2 {
              font-size: 18px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .section p {
              margin: 5px 0;
              font-size: 14px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            .items-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-section {
              margin-top: 30px;
              text-align: right;
              font-size: 18px;
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 12px;
              margin-left: 10px;
            }
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Захиалгын дэлгэрэнгүй</h1>
            <p style="font-size: 16px; margin-top: 10px;">Захиалгын дугаар: #${order.id}</p>
          </div>

          <div class="order-info">
            <div class="section">
              <h2>Харилцагчийн мэдээлэл</h2>
              <p><strong>Нэр:</strong> ${order.customer_name || '-'}</p>
              <p><strong>Утасны дугаар:</strong> ${order.customer_phone || '-'}</p>
              ${order.district ? `<p><strong>Дүүрэг:</strong> ${order.district}</p>` : ''}
              ${order.khoroo ? `<p><strong>Хороо:</strong> ${order.khoroo}</p>` : ''}
              <p><strong>Хаяг:</strong> ${order.address || '-'}</p>
            </div>

            <div class="section">
              <h2>Захиалгын мэдээлэл</h2>
              <p><strong>Үүссэн огноо:</strong> ${order.created_at}</p>
              <p><strong>Төлөв:</strong> ${statusOptions.find(s => s.value === order.status)?.label || order.status}</p>
              <p><strong>Төлбөрийн төлөв:</strong> ${paymentOptions.find(p => p.value === order.payment_status)?.label || order.payment_status}</p>
            </div>
          </div>

          <div class="section">
            <h2>Захиалгын бараанууд</h2>
            <table class="items-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Барааны нэр</th>
                  <th>Тоо ширхэг</th>
                  <th>Нэгжийн үнэ</th>
                  <th>Нийт</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${item.price.toLocaleString()}₮</td>
                    <td>${(item.qty * item.price).toLocaleString()}₮</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="total-section">
            <p>Нийт дүн: ${order.total.toLocaleString()}₮</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    // Open new window and write content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
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
          Нийт: {total} захиалга
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
      <div className="space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
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

        {/* Date Filters */}
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="start-date" className="text-sm whitespace-nowrap">Эхлэх огноо:</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="end-date" className="text-sm whitespace-nowrap">Дуусах огноо:</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-40"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              }}
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-2">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="p-3 shadow-sm border">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-base">#{order.id}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColor[order.status]}`}>
                    {getStatusIcon(order.status)} {statusOptions.find(s => s.value === order.status)?.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${paymentColor[order.payment_status]} flex items-center gap-1`}>
                    {paymentOptions.find(p => p.value === order.payment_status)?.label}
                    {order.payment_status === "paid" && (
                      <>
                        {order.invoice_id ? (
                          <span title="QPay төлбөр">
                            <QrCode className="h-3 w-3" />
                          </span>
                        ) : (
                          <span title="Админ төлбөр">
                            <UserCircle className="h-3 w-3" />
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Үүссэн: {order.created_at}</p>
                {order.customer_name && (
                  <p className="text-xs">
                    <span className="font-medium">Харилцагч:</span> {order.customer_name}
                    {order.customer_phone && ` (${order.customer_phone})`}
                  </p>
                )}
                {order.district && (
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Дүүрэг:</span> {order.district}
                    {order.khoroo && `, Хороо: ${order.khoroo}`}
                  </p>
                )}
              </div>

              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewOrder(order)}
                  className="h-7 px-2 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Харах
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditOrder(order)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Засах
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePrintOrder(order)}
                  className="h-7 px-2 text-xs"
                >
                  <Printer className="h-3 w-3 mr-1" />
                  Хэвлэх
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteOrder(order)}
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Устгах
                </Button>
              </div>
            </div>

            <div className="mt-1 border-t pt-1">
              <p className="font-medium text-sm">Бараанууд:</p>
              <ul className="space-y-0.5 text-sm">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.name} × {item.qty}ш</span>
                    <span className="font-medium">{item.price.toLocaleString()}₮</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center mt-1 pt-1 border-t">
              <div className="text-base font-semibold">
                Нийт: {order.total.toLocaleString()}₮
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-1">
                <Select 
                  value={order.status} 
                  onValueChange={(value: Order["status"]) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-36 h-7 text-xs">
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
                  <SelectTrigger className="w-36 h-7 text-xs">
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

        {filteredOrders.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Захиалга олдсонгүй</p>
          </Card>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Хуудасны хэмжээ:
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-4">
              {((currentPage - 1) * pageSize + 1)}-{Math.min(currentPage * pageSize, total)} / {total}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Өмнөх
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Дараах
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
                  <p>Нэр: {selectedOrder.customer_name || '-'}</p>
                  <p>Утас: {selectedOrder.customer_phone || '-'}</p>
                  {selectedOrder.district && <p>Дүүрэг: {selectedOrder.district}</p>}
                  {selectedOrder.khoroo && <p>Хороо: {selectedOrder.khoroo}</p>}
                  <p>Хаяг: {selectedOrder.address || '-'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Захиалгын мэдээлэл</h4>
                  <p>Үүссэн огноо: {selectedOrder.created_at}</p>
                  <p>Төлөв: {statusOptions.find(s => s.value === selectedOrder.status)?.label}</p>
                  <p className="flex items-center gap-2">
                    Төлбөрийн төлөв: {paymentOptions.find(p => p.value === selectedOrder.payment_status)?.label}
                    {selectedOrder.payment_status === "paid" && (
                      <>
                        {selectedOrder.invoice_id ? (
                          <span title="QPay төлбөр" className="flex items-center">
                            <QrCode className="h-4 w-4" />
                          </span>
                        ) : (
                          <span title="Админ төлбөр" className="flex items-center">
                            <UserCircle className="h-4 w-4" />
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Invoice Information */}
              {(selectedOrder.invoice_name || selectedOrder.invoice_register || selectedOrder.invoice_email || selectedOrder.invoice_phone) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Нэхэмжлэх мэдээлэл</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedOrder.invoice_name && (
                      <p><span className="font-medium">Байгууллагын нэр:</span> {selectedOrder.invoice_name}</p>
                    )}
                    {selectedOrder.invoice_register && (
                      <p><span className="font-medium">Регистрийн дугаар:</span> {selectedOrder.invoice_register}</p>
                    )}
                    {selectedOrder.invoice_email && (
                      <p><span className="font-medium">Цахим шуудан:</span> {selectedOrder.invoice_email}</p>
                    )}
                    {selectedOrder.invoice_phone && (
                      <p><span className="font-medium">Утасны дугаар:</span> {selectedOrder.invoice_phone}</p>
                    )}
                  </div>
                </div>
              )}

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

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Тэмдэглэл</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Хаах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Захиалга засах #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Status and Payment Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Төлөв</Label>
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

                <div className="space-y-2">
                  <Label>Төлбөрийн төлөв</Label>
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

              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Харилцагчийн мэдээлэл</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Харилцагчийн нэр</Label>
                    <Input
                      value={selectedOrder.customer_name || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, customer_name: e.target.value})
                      }
                      placeholder="Харилцагчийн нэр"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Утасны дугаар</Label>
                    <Input
                      value={selectedOrder.customer_phone || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, customer_phone: e.target.value})
                      }
                      placeholder="Утасны дугаар"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Дүүрэг</Label>
                    <Input
                      value={selectedOrder.district || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, district: e.target.value})
                      }
                      placeholder="Дүүрэг"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Хороо</Label>
                    <Input
                      value={selectedOrder.khoroo || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, khoroo: e.target.value})
                      }
                      placeholder="Хороо"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Дэлгэрэнгүй хаяг</Label>
                    <Input
                      value={selectedOrder.address || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, address: e.target.value})
                      }
                      placeholder="Дэлгэрэнгүй хаяг"
                    />
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Бараанууд</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                      <div className="col-span-5">
                        <Input
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...selectedOrder.items];
                            newItems[i].name = e.target.value;
                            setSelectedOrder({...selectedOrder, items: newItems});
                          }}
                          placeholder="Барааны нэр"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...selectedOrder.items];
                            newItems[i].qty = parseInt(e.target.value) || 0;
                            setSelectedOrder({...selectedOrder, items: newItems});
                          }}
                          placeholder="Тоо"
                          min="1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const newItems = [...selectedOrder.items];
                            newItems[i].price = parseFloat(e.target.value) || 0;
                            setSelectedOrder({...selectedOrder, items: newItems});
                          }}
                          placeholder="Үнэ"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {(item.qty * item.price).toLocaleString()}₮
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right text-lg font-bold border-t pt-2">
                  Нийт: {selectedOrder.items.reduce((sum, item) => sum + (item.qty * item.price), 0).toLocaleString()}₮
                </div>
              </div>

              {/* Invoice Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Нэхэмжлэх мэдээлэл</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Байгууллагын нэр</Label>
                    <Input
                      value={selectedOrder.invoice_name || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, invoice_name: e.target.value})
                      }
                      placeholder="Байгууллагын нэр"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Регистрийн дугаар</Label>
                    <Input
                      value={selectedOrder.invoice_register || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, invoice_register: e.target.value})
                      }
                      placeholder="Регистрийн дугаар"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Цахим шуудан</Label>
                    <Input
                      type="email"
                      value={selectedOrder.invoice_email || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, invoice_email: e.target.value})
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Утасны дугаар</Label>
                    <Input
                      type="tel"
                      value={selectedOrder.invoice_phone || ''}
                      onChange={(e) => 
                        setSelectedOrder({...selectedOrder, invoice_phone: e.target.value})
                      }
                      placeholder="Утасны дугаар"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Тэмдэглэл</Label>
                <Textarea
                  value={selectedOrder.notes || ''}
                  onChange={(e) => 
                    setSelectedOrder({...selectedOrder, notes: e.target.value})
                  }
                  placeholder="Тэмдэглэл оруулах..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Цуцлах</Button>
            <Button onClick={async () => {
              if (selectedOrder) {
                try {
                  await updateOrder(selectedOrder);
                  setIsEditOpen(false);
                } catch (err) {
                  // Error is already handled in updateOrder
                }
              }
            }}>Хадгалах</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Захиалга устгах</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Та захиалга <strong>#{orderToDelete?.id}</strong> устгахдаа итгэлтэй байна уу?
            </p>
            {orderToDelete && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Харилцагч:</strong> {orderToDelete.customer_name || '-'}
                </p>
                <p className="text-sm">
                  <strong>Нийт дүн:</strong> {orderToDelete.total.toLocaleString()}₮
                </p>
              </div>
            )}
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Энэ үйлдлийг буцаах боломжгүй!
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteOpen(false);
              setOrderToDelete(null);
            }}>
              Цуцлах
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteOrder}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Устгах
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}