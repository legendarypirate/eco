"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  Calendar,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface SalesAnalytics {
  sales_over_time: Array<{
    period: string;
    order_count: number;
    total_sales: number;
    vendor_earnings: number;
    platform_commission: number;
  }>;
  top_products: Array<{
    product_id: string;
    total_quantity: number;
    total_revenue: number;
    product: {
      id: string;
      name: string;
      thumbnail?: string;
      category?: string;
    };
  }>;
  sales_by_category: Array<{
    category: string;
    order_count: number;
    total_revenue: number;
  }>;
  summary: {
    total_orders: number;
    total_sales: number;
    total_earnings: number;
    total_commission: number;
    average_order_value: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
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

      const response = await fetch(`${API_URL}/api/analytics/sales?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("mn-MN").format(price) + "₮";
  };

  const summary = analytics?.summary || {
    total_orders: 0,
    total_sales: 0,
    total_earnings: 0,
    total_commission: 0,
    average_order_value: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Борлуулалтын шинжилгээ</h1>
          <p className="text-gray-600">Борлуулалт, бараа, ангиллын дэлгэрэнгүй мэдээлэл</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={dateRange === "week" ? "default" : "outline"}
            onClick={() => setDateRange("week")}
          >
            7 хоног
          </Button>
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => setDateRange("month")}
          >
            Сар
          </Button>
          <Button
            variant={dateRange === "year" ? "default" : "outline"}
            onClick={() => setDateRange("year")}
          >
            Жил
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт захиалга</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_orders}</div>
            <p className="text-xs text-muted-foreground">Бүх захиалга</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт борлуулалт</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.total_sales)}</div>
            <p className="text-xs text-muted-foreground">Бүх дэлгүүрээс</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Дэлгүүрийн ашиг</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.total_earnings)}</div>
            <p className="text-xs text-muted-foreground">Комисс хассан</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Платформын комисс</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.total_commission)}</div>
            <p className="text-xs text-muted-foreground">Платформын орлого</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Дундаж үнэ</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.average_order_value)}</div>
            <p className="text-xs text-muted-foreground">Захиалга бүр</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Чансааны бараанууд</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Ачааллаж байна...</div>
          ) : (
            <div className="space-y-4">
              {analytics?.top_products?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Бараа олдсонгүй</div>
              ) : (
                analytics?.top_products?.slice(0, 10).map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-blue-600">{index + 1}</span>
                      </div>
                      {product.product?.thumbnail && (
                        <img
                          src={product.product.thumbnail}
                          alt={product.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <div className="font-medium">{product.product?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">
                          {product.product?.category || "Ангилалгүй"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(product.total_revenue)}</div>
                      <div className="text-sm text-gray-500">
                        {product.total_quantity} ширхэг борлуулсан
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Category */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ангилалаар борлуулалт</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Ачааллаж байна...</div>
            ) : (
              <div className="space-y-4">
                {analytics?.sales_by_category?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Мэдээлэл олдсонгүй</div>
                ) : (
                  analytics?.sales_by_category?.map((category) => (
                    <div
                      key={category.category}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{category.category || "Ангилалгүй"}</div>
                        <div className="text-sm text-gray-500">
                          {category.order_count} захиалга
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(category.total_revenue)}</div>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                analytics.sales_by_category.length > 0
                                  ? (category.total_revenue /
                                      Math.max(
                                        ...analytics.sales_by_category.map((c) => c.total_revenue)
                                      )) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Цаг хугацааны график</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Ачааллаж байна...</div>
            ) : (
              <div className="space-y-2">
                {analytics?.sales_over_time?.slice(-14).map((item) => (
                  <div key={item.period} className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {new Date(item.period).toLocaleDateString("mn-MN")}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">{formatPrice(item.total_sales)}</div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              analytics.sales_over_time.length > 0
                                ? (item.total_sales /
                                    Math.max(
                                      ...analytics.sales_over_time.map((t) => t.total_sales)
                                    )) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

