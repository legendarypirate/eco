"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Ticket, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  expires_at: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  usage_count?: number;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    discount_percentage: '',
    expires_at: '',
    is_active: true,
  });

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/coupons`;

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setCoupons(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch coupons');
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  // Create or update coupon
  const saveCoupon = async () => {
    try {
      if (!formData.discount_percentage || !formData.expires_at) {
        setError('Бүх шаардлагатай талбаруудыг бөглөнө үү');
        return;
      }

      const discount = parseFloat(formData.discount_percentage);
      if (discount <= 0 || discount > 100) {
        setError('Хөнгөлөлтийн хувь 1-100 хооронд байх ёстой');
        return;
      }

      const expirationDate = new Date(formData.expires_at);
      if (expirationDate <= new Date()) {
        setError('Дуусах огноо ирээдүйд байх ёстой');
        return;
      }

      const token = getAuthToken();
      const url = editingCoupon ? `${API_URL}/${editingCoupon.id}` : API_URL;
      const method = editingCoupon ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          discount_percentage: discount,
          expires_at: formData.expires_at,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        await fetchCoupons();
        setIsDialogOpen(false);
        resetForm();
      } else {
        throw new Error(result.error || 'Failed to save coupon');
      }
    } catch (err) {
      console.error('Error saving coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to save coupon');
    }
  };

  // Delete coupon
  const deleteCoupon = async (id: number) => {
    if (!window.confirm('Та энэ урамшууллын кодыг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      await fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete coupon');
    }
  };

  // Open dialog for editing
  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    // Format date for datetime-local input
    const expiresDate = new Date(coupon.expires_at);
    const localDateTime = new Date(expiresDate.getTime() - expiresDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setFormData({
      discount_percentage: coupon.discount_percentage.toString(),
      expires_at: localDateTime,
      is_active: coupon.is_active,
    });
    setIsDialogOpen(true);
  };

  // Open dialog for creating
  const handleCreate = () => {
    setEditingCoupon(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      discount_percentage: '',
      expires_at: '',
      is_active: true,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('mn-MN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if coupon is expired
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Initial fetch
  useEffect(() => {
    fetchCoupons();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Урамшууллын кодуудыг уншиж байна...</p>
      </div>
    );
  }

  const activeCount = coupons.filter(c => c.is_active && !isExpired(c.expires_at)).length;
  const expiredCount = coupons.filter(c => isExpired(c.expires_at)).length;
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0);

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Урамшууллын код</h1>
          <p className="text-gray-600">Урамшууллын кодуудыг удирдах</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Шинэ код нэмэх
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт код</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
            <p className="text-xs text-muted-foreground">
              Бүх урамшууллын код
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхтэй</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Хүчинтэй код
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хугацаа дууссан</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredCount}</div>
            <p className="text-xs text-muted-foreground">
              Дууссан код
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ашиглалт</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Нийт ашиглалтын тоо
            </p>
          </CardContent>
        </Card>
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

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Урамшууллын кодуудын жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-500">Урамшууллын код олдсонгүй</p>
              <Button onClick={handleCreate} variant="outline" className="mt-3">
                Эхний код нэмэх
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Хөнгөлөлт</TableHead>
                  <TableHead>Дуусах огноо</TableHead>
                  <TableHead>Ашиглалт</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon.expires_at);
                  const isActive = coupon.is_active && !expired;
                  
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-bold text-lg">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          {coupon.discount_percentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expired && <Clock className="h-4 w-4 text-red-500" />}
                          <span className={expired ? 'text-red-500' : ''}>
                            {formatDate(coupon.expires_at)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">
                          {coupon.usage_count || 0} удаа
                        </span>
                      </TableCell>
                      <TableCell>
                        {isActive ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Идэвхтэй
                          </span>
                        ) : expired ? (
                          <span className="text-red-500 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Хугацаа дууссан
                          </span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Идэвхгүй
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(coupon)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCoupon(coupon.id)}
                            className="hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Урамшууллын код засах' : 'Шинэ урамшууллын код нэмэх'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingCoupon && (
              <div className="p-3 bg-gray-50 rounded-md">
                <Label className="text-sm text-gray-600">Код</Label>
                <p className="font-mono font-bold text-lg mt-1">{editingCoupon.code}</p>
                <p className="text-xs text-gray-500 mt-1">Код автоматаар үүсгэгдсэн байна</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="discount_percentage">
                Хөнгөлөлтийн хувь (%) *
              </Label>
              <Input
                id="discount_percentage"
                type="number"
                min="1"
                max="100"
                step="0.01"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                placeholder="Жишээ: 10, 20, 50"
              />
              <p className="text-xs text-gray-500 mt-1">
                1-100 хооронд утга оруулна уу
              </p>
            </div>
            
            <div>
              <Label htmlFor="expires_at">
                Дуусах огноо ба цаг *
              </Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ирээдүйн огноо ба цаг сонгоно уу
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Идэвхтэй (хэрэглэгчдэд харагдана)
              </Label>
            </div>
            
            {!editingCoupon && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Анхаар:</strong> Урамшууллын код автоматаар 6 тэмдэгттэй том үсгээр үүсгэгдэнэ.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={saveCoupon}>
              {editingCoupon ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

