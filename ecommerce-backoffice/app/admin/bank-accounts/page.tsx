"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Wallet, CheckCircle, XCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  display_order: number;
  color_scheme: string;
  created_at?: string;
  updated_at?: string;
}

const colorSchemes = [
  { value: 'blue', label: 'Цэнхэр', className: 'bg-blue-50 border-blue-200' },
  { value: 'green', label: 'Ногоон', className: 'bg-green-50 border-green-200' },
  { value: 'purple', label: 'Нил ягаан', className: 'bg-purple-50 border-purple-200' },
  { value: 'orange', label: 'Улбар шар', className: 'bg-orange-50 border-orange-200' },
  { value: 'red', label: 'Улаан', className: 'bg-red-50 border-red-200' },
];

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    is_active: true,
    display_order: 0,
    color_scheme: 'blue',
  });

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts`;

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
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
        setBankAccounts(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch bank accounts');
      }
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  };

  // Create or update bank account
  const saveBankAccount = async () => {
    try {
      if (!formData.bank_name.trim() || !formData.account_number.trim() || !formData.account_name.trim()) {
        setError('Бүх шаардлагатай талбаруудыг бөглөнө үү');
        return;
      }

      const token = getAuthToken();
      const url = editingAccount ? `${API_URL}/${editingAccount.id}` : API_URL;
      const method = editingAccount ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        await fetchBankAccounts();
        setIsDialogOpen(false);
        resetForm();
      } else {
        throw new Error(result.error || 'Failed to save bank account');
      }
    } catch (err) {
      console.error('Error saving bank account:', err);
      setError(err instanceof Error ? err.message : 'Failed to save bank account');
    }
  };

  // Delete bank account
  const deleteBankAccount = async (id: number) => {
    if (!window.confirm('Та энэ банкны дансыг устгахдаа итгэлтэй байна уу?')) {
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

      await fetchBankAccounts();
    } catch (err) {
      console.error('Error deleting bank account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete bank account');
    }
  };

  // Open dialog for editing
  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_name: account.account_name,
      is_active: account.is_active,
      display_order: account.display_order,
      color_scheme: account.color_scheme,
    });
    setIsDialogOpen(true);
  };

  // Open dialog for creating
  const handleCreate = () => {
    setEditingAccount(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      bank_name: '',
      account_number: '',
      account_name: '',
      is_active: true,
      display_order: 0,
      color_scheme: 'blue',
    });
  };

  // Initial fetch
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Банкны дансыг уншиж байна...</p>
      </div>
    );
  }

  const activeCount = bankAccounts.filter(acc => acc.is_active).length;
  const inactiveCount = bankAccounts.filter(acc => !acc.is_active).length;

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Банкны данс</h1>
          <p className="text-gray-600">Банкны дансны мэдээллийг удирдах</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Шинэ данс нэмэх
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт данс</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bankAccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              Бүх банкны данс
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
              Идэвхтэй данс
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхгүй</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactiveCount}</div>
            <p className="text-xs text-muted-foreground">
              Идэвхгүй данс
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

      {/* Bank Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Банкны дансны жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          {bankAccounts.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-500">Банкны данс олдсонгүй</p>
              <Button onClick={handleCreate} variant="outline" className="mt-3">
                Эхний данс нэмэх
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Банкны нэр</TableHead>
                  <TableHead>Дансны дугаар</TableHead>
                  <TableHead>Дансны нэр</TableHead>
                  <TableHead>Эрэмбэ</TableHead>
                  <TableHead>Өнгө</TableHead>
                  <TableHead>Төлөв</TableHead>
                  <TableHead className="text-right">Үйлдэл</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => {
                  const colorScheme = colorSchemes.find(cs => cs.value === account.color_scheme);
                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.bank_name}</TableCell>
                      <TableCell className="font-mono">{account.account_number}</TableCell>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell>{account.display_order}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${colorScheme?.className.split(' ')[0]}`}></div>
                          <span className="text-sm">{colorScheme?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.is_active ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Идэвхтэй
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
                            onClick={() => handleEdit(account)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteBankAccount(account.id)}
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
              {editingAccount ? 'Банкны данс засах' : 'Шинэ банкны данс нэмэх'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Банкны нэр *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Жишээ: Хаан банк, Голомт банк"
              />
            </div>
            <div>
              <Label htmlFor="account_number">Дансны дугаар *</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="Жишээ: 5012345678"
              />
            </div>
            <div>
              <Label htmlFor="account_name">Дансны нэр *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="Жишээ: 1018shop LLC"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_order">Эрэмбэ</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="color_scheme">Өнгөний схем</Label>
                <Select
                  value={formData.color_scheme}
                  onValueChange={(value) => setFormData({ ...formData, color_scheme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map((scheme) => (
                      <SelectItem key={scheme.value} value={scheme.value}>
                        {scheme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Цуцлах
            </Button>
            <Button onClick={saveBankAccount}>
              {editingAccount ? 'Хадгалах' : 'Нэмэх'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

