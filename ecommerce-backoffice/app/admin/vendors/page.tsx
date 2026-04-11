"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Store,
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Eye,
  Edit,
  Trash2,
  Plus,
  ShieldCheck,
  Star,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Vendor {
  id: string;
  store_name: string;
  store_slug: string;
  status: "pending" | "active" | "suspended" | "inactive";
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  total_sales: number;
  total_earnings: number;
  total_orders: number;
  commission_rate: number;
  rating: number;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchVendors();
  }, [statusFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`${API_URL}/api/vendors?${params}`);
      const data = await response.json();

      if (data.success) {
        setVendors(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("mn-MN").format(price) + "₮";
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: "Идэвхтэй", color: "bg-green-100 text-green-700 border-green-200" },
      pending: { label: "Хүлээгдэж байна", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      suspended: { label: "Түдгэлзүүлсэн", color: "bg-red-100 text-red-700 border-red-200" },
      inactive: { label: "Идэвхгүй", color: "bg-gray-100 text-gray-700 border-gray-200" },
    };
    const item = config[status as keyof typeof config] || config.pending;
    return (
      <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", item.color)}>
        {item.label}
      </div>
    );
  };

  const getVerificationBadge = (status: string) => {
    const config = {
      verified: { label: "Баталгаажсан", icon: ShieldCheck, color: "text-blue-600" },
      pending: { label: "Хүлээгдэж байна", icon: Clock, color: "text-yellow-600" },
      unverified: { label: "Баталгаажаагүй", icon: XCircle, color: "text-gray-400" },
      rejected: { label: "Татгалзсан", icon: XCircle, color: "text-red-500" },
    };
    const item = config[status as keyof typeof config] || config.unverified;
    const Icon = item.icon;
    return (
      <div className={cn("flex items-center gap-1.5 text-xs font-medium", item.color)}>
        <Icon className="w-3.5 h-3.5" />
        {item.label}
      </div>
    );
  };

  const filteredVendors = vendors.filter((vendor) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        vendor.store_name.toLowerCase().includes(searchLower) ||
        vendor.store_slug.toLowerCase().includes(searchLower) ||
        vendor.user?.email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const totals = vendors.reduce(
    (acc, vendor) => ({
      totalSales: acc.totalSales + (vendor.total_sales || 0),
      totalEarnings: acc.totalEarnings + (vendor.total_earnings || 0),
      totalOrders: acc.totalOrders + (vendor.total_orders || 0),
    }),
    { totalSales: 0, totalEarnings: 0, totalOrders: 0 }
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Дэлгүүрүүд & Түншүүд</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Олон дэлгүүр нэг талбарт бараа борлуулна. Шинэ дэлгүүрийн үндсэн комиссын хувь:{" "}
            <strong>3%</strong> (борлуулалтын дүнгээс; хүргэлт, татвар комиссонд орохгүй). Тохиргоог эндээс өөрчилж болно.
          </p>
        </div>
        <Button className="gap-2 shadow-lg">
          <Plus className="w-4 h-4" />
          Шинэ дэлгүүр нэмэх
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-blue-600 tracking-wider">Нийт дэлгүүр</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{vendors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-blue-600 font-semibold">{vendors.filter((v) => v.status === "active").length}</span> идэвхтэй ажиллаж байна
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Нийт борлуулалт</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(totals.totalSales)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>{formatPrice(totals.totalEarnings)} ашиг</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-violet-600 tracking-wider">Нийт захиалга</CardTitle>
            <Package className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1 text-violet-600 font-medium">Сүүлийн 30 хоногт +12%</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase text-orange-600 tracking-wider">Дундаж комисс</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {vendors.length > 0
                ? (vendors.reduce((sum, v) => sum + (v.commission_rate || 0), 0) / vendors.length).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1 italic text-orange-600">Платформын үндсэн хувь</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Дэлгүүр эсвэл имэйлээр хайх..."
                className="pl-10 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-input rounded-md text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              >
                <option value="all">Бүх төлөв</option>
                <option value="active">Идэвхтэй</option>
                <option value="pending">Хүлээгдэж байна</option>
                <option value="suspended">Түдгэлзүүлсэн</option>
              </select>
              <Button variant="outline" onClick={fetchVendors} className="bg-white">
                <Clock className="w-4 h-4 mr-2" />
                Сэргээх
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground font-medium">Мэдээлэл ачааллаж байна...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase cursor-pointer hover:text-primary transition-colors">Дэлгүүрийн мэдээлэл</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase">Хэрэглэгч</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase">Төлөв / Баталгаа</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-right">Борлуулалт / Ашиг</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-center">Үнэлгээ</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-xs uppercase text-right">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center gap-2 opacity-40">
                          <Store className="w-12 h-12" />
                          <p className="text-lg font-medium">Дэлгүүр олдсонгүй</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id} className="hover:bg-muted/40 transition-colors group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/5 border flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                              {vendor.store_name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-base leading-tight">{vendor.store_name}</span>
                              <span className="text-xs text-muted-foreground">slug: {vendor.store_slug}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{vendor.user?.full_name || "N/A"}</span>
                            <span className="text-xs text-muted-foreground">{vendor.user?.email || ""}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col gap-2">
                            {getStatusBadge(vendor.status)}
                            {getVerificationBadge(vendor.verification_status)}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex flex-col">
                            <span className="font-bold text-base">{formatPrice(vendor.total_sales || 0)}</span>
                            <span className="text-xs text-emerald-600 font-semibold">{formatPrice(vendor.total_earnings || 0)} (Ашиг)</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-sm font-bold">{vendor.rating || "0.0"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


