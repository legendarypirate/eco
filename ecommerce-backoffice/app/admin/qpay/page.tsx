"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

type QPayPayment = {
  id: string;
  invoice_id: string;
  amount: number;
  status: "paid" | "pending" | "expired" | "cancelled";
  description: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  paid_at: string | null;
  qpay_invoice_id: string;
  payment_url: string;
  qr_image: string;
};

export default function QPayPaymentList() {
  const [payments, setPayments] = useState<QPayPayment[]>([
    {
      id: "1",
      invoice_id: "INV-2024-001",
      amount: 150000,
      status: "paid",
      description: "iPhone 15 Pro худалдан авалт",
      customer_name: "Бат",
      customer_phone: "99999999",
      created_at: "2024-01-15 14:30:00",
      paid_at: "2024-01-15 14:35:00",
      qpay_invoice_id: "QPAY-INV-001",
      payment_url: "https://qpay.mn/pay/001",
      qr_image: "/api/placeholder/100/100"
    },
    {
      id: "2",
      invoice_id: "INV-2024-002",
      amount: 75000,
      status: "pending",
      description: "AirPods Pro 2",
      customer_name: "Сараа",
      customer_phone: "88888888",
      created_at: "2024-01-15 15:20:00",
      paid_at: null,
      qpay_invoice_id: "QPAY-INV-002",
      payment_url: "https://qpay.mn/pay/002",
      qr_image: "/api/placeholder/100/100"
    },
    {
      id: "3",
      invoice_id: "INV-2024-003",
      amount: 420000,
      status: "expired",
      description: "Samsung S24 Ultra",
      customer_name: "Төгс",
      customer_phone: "77777777",
      created_at: "2024-01-14 10:15:00",
      paid_at: null,
      qpay_invoice_id: "QPAY-INV-003",
      payment_url: "https://qpay.mn/pay/003",
      qr_image: "/api/placeholder/100/100"
    },
    {
      id: "4",
      invoice_id: "INV-2024-004",
      amount: 250000,
      status: "cancelled",
      description: "MacBook Air",
      customer_name: "Болд",
      customer_phone: "66666666",
      created_at: "2024-01-13 16:45:00",
      paid_at: null,
      qpay_invoice_id: "QPAY-INV-004",
      payment_url: "https://qpay.mn/pay/004",
      qr_image: "/api/placeholder/100/100"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<QPayPayment | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const statusOptions = [
    { value: "all", label: "Бүх төлөв" },
    { value: "paid", label: "Төлөгдсөн" },
    { value: "pending", label: "Хүлээгдэж байна" },
    { value: "expired", label: "Хүчингүй болсон" },
    { value: "cancelled", label: "Цуцлагдсан" }
  ];

  const statusConfig = {
    paid: { label: "Төлөгдсөн", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
    pending: { label: "Хүлээгдэж байна", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
    expired: { label: "Хүчингүй болсон", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    cancelled: { label: "Цуцлагдсан", color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_phone.includes(searchTerm) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewPayment = (payment: QPayPayment) => {
    setSelectedPayment(payment);
    setIsViewOpen(true);
  };

  const handleRefreshStatus = async (paymentId: string) => {
    // Simulate API call to refresh payment status
    console.log("Refreshing status for:", paymentId);
    
    // In real implementation, you would call your API here
    // const updatedPayment = await refreshQPayStatus(paymentId);
  };

  const totalStats = {
    paid: payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === "pending").length,
    total: payments.reduce((sum, p) => sum + p.amount, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">QPay Төлбөрийн жагсаалт</h1>
          <p className="text-gray-600">QPay төлбөрийн гүйлгээний мэдээлэл</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Шинэ төлбөр үүсгэх
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт төлбөр</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.total.toLocaleString()}₮</div>
            <p className="text-xs text-muted-foreground">
              {payments.length} ширхэг төлбөр
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Төлөгдсөн</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.paid.toLocaleString()}₮</div>
            <p className="text-xs text-muted-foreground">
              {payments.filter(p => p.status === "paid").length} ширхэг
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хүлээгдэж байна</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Төлбөр хүлээгдэж байна
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Invoice ID, харилцагчийн нэр, утас, тайлбараар хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Төлбөрийн төлөв" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Шүүлтүүр
            </Button>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Төлбөрийн жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>QPay Invoice ID</TableHead>
                <TableHead>Харилцагч</TableHead>
                <TableHead>Дүн</TableHead>
                <TableHead>Тайлбар</TableHead>
                <TableHead>Үүссэн огноо</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const StatusIcon = statusConfig[payment.status].icon;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.invoice_id}</TableCell>
                    <TableCell className="text-sm text-gray-600">{payment.qpay_invoice_id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.customer_name}</div>
                        <div className="text-sm text-gray-600">{payment.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{payment.amount.toLocaleString()}₮</TableCell>
                    <TableCell className="max-w-xs truncate">{payment.description}</TableCell>
                    <TableCell>{payment.created_at}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={statusConfig[payment.status].color}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[payment.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewPayment(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshStatus(payment.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Төлбөр олдсонгүй
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Төлбөрийн дэлгэрэнгүй</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Үндсэн мэдээлэл</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Invoice ID:</span>
                      <span className="font-medium">{selectedPayment.invoice_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>QPay Invoice ID:</span>
                      <span className="font-medium">{selectedPayment.qpay_invoice_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Төлбөрийн дүн:</span>
                      <span className="font-medium">{selectedPayment.amount.toLocaleString()}₮</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Төлөв:</span>
                      <Badge variant="outline" className={statusConfig[selectedPayment.status].color}>
                        {statusConfig[selectedPayment.status].label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Харилцагчийн мэдээлэл</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Нэр:</span>
                      <span>{selectedPayment.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Утас:</span>
                      <span>{selectedPayment.customer_phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Тайлбар</h4>
                  <p className="text-sm">{selectedPayment.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Цаг хугацаа</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Үүссэн:</span>
                      <span>{selectedPayment.created_at}</span>
                    </div>
                    {selectedPayment.paid_at && (
                      <div className="flex justify-between">
                        <span>Төлсөн:</span>
                        <span>{selectedPayment.paid_at}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">QR код</h4>
                  <div className="border rounded-lg p-4 flex justify-center">
                    <img 
                      src={selectedPayment.qr_image} 
                      alt="QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Төлбөрийн холбоос</h4>
                  <div className="flex gap-2">
                    <Input
                      value={selectedPayment.payment_url}
                      readOnly
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => window.open(selectedPayment.payment_url, '_blank')}>
                      Нээх
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Хаах</Button>
            <Button onClick={() => handleRefreshStatus(selectedPayment?.id || '')}>
              Төлөв шинэчлэх
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Шинэ төлбөр үүсгэх</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Invoice ID</label>
                <Input placeholder="INV-2024-001" />
              </div>
              <div>
                <label className="text-sm font-medium">Дүн</label>
                <Input type="number" placeholder="100000" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Тайлбар</label>
              <Input placeholder="Барааны нэр, үйлчилгээний төрөл..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Харилцагчийн нэр</label>
                <Input placeholder="Бат" />
              </div>
              <div>
                <label className="text-sm font-medium">Утасны дугаар</label>
                <Input placeholder="99999999" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Цуцлах</Button>
            <Button>Төлбөр үүсгэх</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}