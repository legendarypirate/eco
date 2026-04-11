"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Wallet,
  Activity,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface FinancialReport {
  summary: Array<{
    transaction_type: string;
    count: number;
    total_amount: number;
  }>;
  totals: {
    total_sales: number;
    total_commission: number;
    total_payouts: number;
    transaction_count: number;
  };
  time_series: Array<{
    period: string;
    count: number;
    total_amount: number;
  }>;
  top_vendors: Array<{
    vendor_id: string;
    order_count: number;
    total_sales: number;
    total_earnings: number;
    vendor: {
      id: string;
      store_name: string;
      logo?: string;
    };
  }>;
}

export default function FinancialPage() {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    fetchFinancialReport();
  }, [dateRange]);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: now.toISOString(),
        group_by: "day",
      });

      const response = await fetch(`${API_URL}/api/financial/reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setReport(data.data);
      }
    } catch (error) {
      console.error("Error fetching financial report:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("mn-MN").format(price) + "₮";
  };

  const totals = report?.totals || {
    total_sales: 0,
    total_commission: 0,
    total_payouts: 0,
    transaction_count: 0,
  };

  const netRevenue = totals.total_sales - totals.total_payouts;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Санхүүгийн удирдлага</h1>
          <p className="text-muted-foreground mt-1">Тайлан, гүйлгээ болон платформын орлогын нарийвчилсан мэдээлэл</p>
        </div>
        <div className="flex items-center gap-1 bg-card p-1 rounded-xl border shadow-sm">
          <Button
            variant={dateRange === "week" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-lg px-4"
            onClick={() => setDateRange("week")}
          >
            7 хоног
          </Button>
          <Button
            variant={dateRange === "month" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-lg px-4"
            onClick={() => setDateRange("month")}
          >
            Сар
          </Button>
          <Button
            variant={dateRange === "year" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-lg px-4"
            onClick={() => setDateRange("year")}
          >
            Жил
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-emerald-600 to-emerald-800 text-white overflow-hidden relative group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase opacity-80 tracking-widest">Нийт борлуулалт</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(totals.total_sales)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs opacity-90">
              <Activity className="w-3 h-3" />
              <span>{totals.transaction_count} гүйлгээ хийгдсэн</span>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="w-32 h-32" />
          </div>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden relative group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase opacity-80 tracking-widest">Платформын ашиг</CardTitle>
            <Wallet className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(totals.total_commission)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs opacity-90 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>{totals.total_sales > 0 ? ((totals.total_commission / totals.total_sales) * 100).toFixed(1) : 0}% дундаж шимтгэл</span>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="w-32 h-32" />
          </div>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-purple-600 to-purple-800 text-white overflow-hidden relative group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase opacity-80 tracking-widest">Нийт payouts</CardTitle>
            <CreditCard className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(totals.total_payouts)}</div>
            <p className="text-xs opacity-80 mt-2">Дэлгүүрүүдэд шилжүүлсэн</p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard className="w-32 h-32" />
          </div>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-orange-600 to-orange-800 text-white overflow-hidden relative group">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase opacity-80 tracking-widest">Цэвэр үлдэгдэл</CardTitle>
            <Activity className="h-4 w-4 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(netRevenue)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs opacity-90">
              {netRevenue >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>Комисс ба Төлбөрийн зөрүү</span>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="w-32 h-32" />
          </div>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content: Chart & Summary */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-sm border-none bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Цаг хугацааны шинжилгээ</CardTitle>
                  <CardDescription>Өдрийн гүйлгээний дундаж дүн</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white/50">{dateRange === 'month' ? 'Энэ сар' : dateRange}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {report?.time_series?.slice(-7).map((item) => (
                    <div key={item.period} className="flex items-center gap-4 group">
                      <div className="w-24 text-xs font-bold text-muted-foreground uppercase text-right">
                        {new Date(item.period).toLocaleDateString("mn-MN", { weekday: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden relative border border-muted/20">
                        <div
                          className="absolute left-0 top-0 h-full bg-primary/60 group-hover:bg-primary transition-all duration-700 ease-out rounded-full"
                          style={{
                            width: `${report.time_series.length > 0 ? (item.total_amount / Math.max(...report.time_series.map((t) => t.total_amount))) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <div className="w-32 text-right">
                        <span className="text-sm font-bold">{formatPrice(item.total_amount)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center mt-6 pt-6 border-t px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span>Даваа</span>
                    <span>Лхагва</span>
                    <span>Баасан</span>
                    <span>Ням</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle>Гүйлгээний төрлөөр</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted/50">
                {report?.summary?.map((item) => (
                  <div key={item.transaction_type} className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                        item.transaction_type === "commission" || item.transaction_type === "payout"
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      )}>
                        {item.transaction_type === "payout" ? <CreditCard className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold capitalize">{item.transaction_type}</p>
                        <p className="text-xs text-muted-foreground font-medium">{item.count} гүйлгээ гарсан</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black tracking-tight",
                        item.transaction_type === "commission" || item.transaction_type === "payout"
                          ? "text-red-600"
                          : "text-emerald-600"
                      )}>
                        {item.transaction_type === "commission" || item.transaction_type === "payout" ? "-" : "+"}
                        {formatPrice(Math.abs(item.total_amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-8">
          <Card className="shadow-sm border-none bg-indigo-600 text-white overflow-hidden relative">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Чансааны дэлгүүрүүд</CardTitle>
              <CardDescription className="text-white/60">Шилдэг борлуулалттай түншүүд</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2 relative z-10">
                {report?.top_vendors?.slice(0, 5).map((vendor, index) => (
                  <div key={vendor.vendor_id} className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-sm border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs ring-2 ring-white/10">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate w-24">{vendor.vendor?.store_name || "N/A"}</p>
                        <p className="text-[10px] text-white/50">{vendor.order_count} захиалга</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatPrice(vendor.total_sales)}</p>
                      <p className="text-[10px] text-emerald-300 font-bold">+{formatPrice(vendor.total_earnings)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-6 text-white hover:bg-white/10 text-xs gap-2">
                Бүх дэлгүүрийг харах <ArrowRight className="w-3 h-3" />
              </Button>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-primary" />
                Шуурхай үйлдэл
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <Button className="justify-start gap-3 h-12 shadow-sm rounded-xl">
                <TrendingUp className="w-4 h-4" /> Татварын тайлан татах
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-12 rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                <Activity className="w-4 h-4" /> Төлбөрийн түүх үзэх
              </Button>
              <Button variant="outline" className="justify-start gap-3 h-12 rounded-xl">
                <Wallet className="w-4 h-4" /> Дэлгүүрүүдэд payout хийх
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


