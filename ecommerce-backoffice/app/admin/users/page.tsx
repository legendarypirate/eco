"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, ShoppingCart, Calendar, MapPin, UserPlus, Search, Filter, Edit, Trash2, Loader2 } from "lucide-react";

// API base URL
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/user`;
const API_URL_ALL = `${process.env.NEXT_PUBLIC_API_URL}/api/user/all`;

// User type based on your API
export interface UserData {
  id: number;
  full_name: string;
  phone: string;
  password?: string;
  role: "admin" | "user"; // Only these two roles
  supervisor_id: number | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  // Display fields
  email?: string;
  location?: string;
  total_orders?: number;
  total_spent?: number;
  device?: "mobile" | "desktop" | "tablet";
}

// User Form Component
function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading
}: {
  user?: UserData;
  onSubmit: (userData: Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }>({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
    role: user?.role || "user",
    supervisor_id: user?.supervisor_id || null,
    is_active: user?.is_active ?? true,
    email: user?.email || "",
    location: user?.location || "Улаанбаатар",
    total_orders: user?.total_orders || 0,
    total_spent: user?.total_spent || 0,
    device: user?.device || "mobile",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Бүтэн нэр</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => setForm({...form, full_name: e.target.value})}
            placeholder="Бүтэн нэр"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Утасны дугаар</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({...form, phone: e.target.value})}
            placeholder="99999999"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Имэйл</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            placeholder="имэйл хаяг"
          />
        </div>

        {!user && (
          <div>
            <Label htmlFor="password">Нууц үг</Label>
            <Input
              id="password"
              type="password"
              value={form.password || ""}
              onChange={(e) => setForm({...form, password: e.target.value})}
              placeholder="Нууц үг оруулах"
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="role">Үүрэг</Label>
          <Select
            value={form.role}
            onValueChange={(value: "admin" | "user") => setForm({...form, role: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Админ</SelectItem>
              <SelectItem value="user">Хэрэглэгч</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="is_active">Төлөв</Label>
          <Select
            value={form.is_active ? "active" : "inactive"}
            onValueChange={(value) => setForm({...form, is_active: value === "active"})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Идэвхтэй</SelectItem>
              <SelectItem value="inactive">Идэвхгүй</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="location">Байршил</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => setForm({...form, location: e.target.value})}
            placeholder="Хот, сум, дүүрэг"
          />
        </div>

        <div>
          <Label htmlFor="device">Төхөөрөмж</Label>
          <Select
            value={form.device}
            onValueChange={(value: "mobile" | "desktop" | "tablet") => setForm({...form, device: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mobile">Утас</SelectItem>
              <SelectItem value="desktop">Компьютер</SelectItem>
              <SelectItem value="tablet">Таблет</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="total_orders">Захиалгын тоо</Label>
          <Input
            id="total_orders"
            type="number"
            value={form.total_orders}
            onChange={(e) => setForm({...form, total_orders: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>

        <div>
          <Label htmlFor="total_spent">Зарцуулалт (₮)</Label>
          <Input
            id="total_spent"
            type="number"
            value={form.total_spent}
            onChange={(e) => setForm({...form, total_spent: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Цуцлах
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            user ? "Хадгалах" : "Үүсгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, userId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(API_URL_ALL);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        // Map API data to our UserData type
        const mappedUsers: UserData[] = result.data.map((user: any) => {
          // Determine role: director and general_manager become admin, others become user
          let role: "admin" | "user" = "user";
          if (user.role === "director" || user.role === "general_manager") {
            role = "admin";
          }
          
          return {
            id: user.id,
            full_name: user.full_name || '',
            phone: user.phone || '',
            password: user.password,
            role: role,
            supervisor_id: user.supervisor_id || null,
            is_active: user.is_active !== undefined ? user.is_active : true,
            createdAt: user.created_at || user.createdAt || new Date().toISOString(),
            updatedAt: user.updated_at || user.updatedAt || new Date().toISOString(),
            // Add default values for display fields
            email: user.email || undefined,
            location: user.location || ["Улаанбаатар", "Дархан", "Эрдэнэт"][Math.floor(Math.random() * 3)],
            total_orders: user.total_orders || Math.floor(Math.random() * 20),
            total_spent: user.total_spent || Math.floor(Math.random() * 1000000) + 100000,
            device: (user.device || ["mobile", "desktop", "tablet"][Math.floor(Math.random() * 3)]) as "mobile" | "desktop" | "tablet"
          };
        });
        
        setUsers(mappedUsers);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user via API
  const createUser = async (userData: Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      // Map role back to API format
      const apiRole = userData.role === "admin" ? "general_manager" : "worker";
      
      const apiData: any = {
        full_name: userData.full_name,
        phone: userData.phone || undefined,
        password: userData.password || "default123", // Use provided password or default
        role: apiRole,
        is_active: userData.is_active !== undefined ? userData.is_active : true
      };
      
      // Only include email if provided
      if (userData.email && userData.email.trim() !== '') {
        apiData.email = userData.email.trim();
      }
      
      // Only include supervisor_id if provided
      if (userData.supervisor_id !== null && userData.supervisor_id !== undefined) {
        apiData.supervisor_id = userData.supervisor_id;
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Map the response back to our format
        const apiUser = result.data;
        let role: "admin" | "user" = "user";
        if (apiUser.role === "director" || apiUser.role === "general_manager") {
          role = "admin";
        }
        
        // Add the new user to the list
        const newUser: UserData = {
          id: apiUser.id,
          full_name: apiUser.full_name,
          phone: apiUser.phone || '',
          role: role,
          supervisor_id: apiUser.supervisor_id || null,
          is_active: apiUser.is_active !== undefined ? apiUser.is_active : true,
          createdAt: apiUser.created_at || apiUser.createdAt || new Date().toISOString(),
          updatedAt: apiUser.updated_at || apiUser.updatedAt || new Date().toISOString(),
          email: userData.email,
          location: userData.location,
          total_orders: userData.total_orders,
          total_spent: userData.total_spent,
          device: userData.device
        };
        
        setUsers([...users, newUser]);
        setShowForm(false);
        setSuccess("Хэрэглэгч амжилттай үүсгэгдлээ");
        // Refresh the list to get the latest data
        setTimeout(() => fetchUsers(), 500);
      } else {
        throw new Error(result.message || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update user via API
  const updateUser = async (userData: Omit<UserData, "id" | "createdAt" | "updatedAt" | "password"> & { password?: string }) => {
    try {
      if (!editingUser) return;
      
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      // Map role back to API format
      const apiRole = userData.role === "admin" ? "general_manager" : "worker";
      
      const apiData: any = {
        full_name: userData.full_name,
        phone: userData.phone || undefined,
        role: apiRole,
        is_active: userData.is_active !== undefined ? userData.is_active : true
      };
      
      // Only include supervisor_id if provided
      if (userData.supervisor_id !== null && userData.supervisor_id !== undefined) {
        apiData.supervisor_id = userData.supervisor_id;
      } else {
        apiData.supervisor_id = null;
      }
      
      // Only update password if provided
      if (userData.password && userData.password.trim() !== '') {
        apiData.password = userData.password;
      }
      
      const response = await fetch(`${API_URL}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Map the response back to our format
        const apiUser = result.data;
        let role: "admin" | "user" = "user";
        if (apiUser.role === "director" || apiUser.role === "general_manager") {
          role = "admin";
        }
        
        // Update the user in the list
        const updatedUsers = users.map(user => 
          user.id === editingUser.id 
            ? { 
                ...user, 
                full_name: apiUser.full_name,
                phone: apiUser.phone || '',
                role: role,
                supervisor_id: apiUser.supervisor_id || null,
                is_active: apiUser.is_active !== undefined ? apiUser.is_active : true,
                email: userData.email,
                location: userData.location,
                total_orders: userData.total_orders,
                total_spent: userData.total_spent,
                device: userData.device,
                updatedAt: apiUser.updated_at || apiUser.updatedAt || new Date().toISOString()
              }
            : user
        );
        
        setUsers(updatedUsers);
        setEditingUser(null);
        setShowForm(false);
        setSuccess("Хэрэглэгч амжилттай шинэчлэгдлээ");
        // Refresh the list to get the latest data
        setTimeout(() => fetchUsers(), 500);
      } else {
        throw new Error(result.message || 'Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete user via API
  const deleteUser = async (userId: number) => {
    try {
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`${API_URL}/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Remove the user from the list
        setUsers(users.filter(user => user.id !== userId));
        setDeleteDialog({open: false});
        setSuccess("Хэрэглэгч амжилттай устгагдлаа");
        // Refresh the list to get the latest data
        setTimeout(() => fetchUsers(), 500);
      } else {
        throw new Error(result.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.location && user.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    totalAdmins: users.filter(u => u.role === "admin").length,
    totalUsersCount: users.filter(u => u.role === "user").length,
    totalRevenue: users.reduce((sum, user) => sum + (user.total_spent || 0), 0),
    totalOrders: users.reduce((sum, user) => sum + (user.total_orders || 0), 0),
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('mn-MN').format(price) + '₮';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  const getRoleColor = (role: UserData["role"]) => {
    return role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('mn-MN');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Хэрэглэгчдийн мэдээлэл уншиж байна...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Хэрэглэгчийн удирдлага</h2>
          <p className="text-gray-600">Системийн хэрэглэгчдийн мэдээлэл</p>
        </div>
        <Button 
          onClick={() => { setEditingUser(null); setShowForm(true); setError(null); }}
          className="flex items-center gap-2"
        >
          <UserPlus size={16} />
          Шинэ хэрэглэгч
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start">
            <div className="text-sm text-green-800">{success}</div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт хэрэглэгч</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Бүртгэлтэй хэрэглэгчид
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Идэвхтэй хэрэглэгч</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Идэвхтэй хэрэглэгчид
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Админууд</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdmins}</div>
            <p className="text-xs text-muted-foreground">
              Системийн админууд
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт зарцуулалт</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Бүх хэрэглэгчдийн нийт зарцуулалт
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 max-w-md w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Нэр, утас, имэйл, хаягаар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select 
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Үүрэг" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх үүрэг</SelectItem>
                  <SelectItem value="admin">Админ</SelectItem>
                  <SelectItem value="user">Хэрэглэгч</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Төлөв" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх төлөв</SelectItem>
                  <SelectItem value="active">Идэвхтэй</SelectItem>
                  <SelectItem value="inactive">Идэвхгүй</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Хэрэглэгч засах" : "Шинэ хэрэглэгч үүсгэх"}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <UserForm
              user={editingUser || undefined}
              onSubmit={editingUser ? updateUser : createUser}
              onCancel={() => { setShowForm(false); setEditingUser(null); }}
              isLoading={isFormLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Хэрэглэгчийн жагсаалт</span>
            <span className="text-sm text-muted-foreground">
              {filteredUsers.length} хэрэглэгч
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Хэрэглэгч</th>
                  <th className="text-left p-3">Холбоо барих</th>
                  <th className="text-left p-3">Үүрэг</th>
                  <th className="text-left p-3">Төлөв</th>
                  <th className="text-left p-3">Захиалга</th>
                  <th className="text-left p-3">Зарцуулалт</th>
                  <th className="text-left p-3">Байршил</th>
                  <th className="text-left p-3">Бүртгүүлсэн</th>
                  <th className="text-left p-3">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-xs text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{user.phone}</div>
                        {user.email && (
                          <div className="text-xs text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(user.is_active)}>
                        {user.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{user.total_orders || 0}</div>
                      <div className="text-xs text-gray-500">захиалга</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-green-600">
                        {formatPrice(user.total_spent || 0)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div>{user.location || "-"}</div>
                      <div className="text-xs text-gray-500">{user.device || "-"}</div>
                    </td>
                    <td className="p-3">
                      <div>{formatDate(user.createdAt)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleTimeString('mn-MN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingUser(user); setShowForm(true); setError(null); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteDialog({open: true, userId: user.id})}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      Хэрэглэгч олдсонгүй
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({open})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Хэрэглэгч устгах уу?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Энэ үйлдлийг буцаах боломжгүй. Та устгахдаа итгэлтэй байна уу?
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDeleteDialog({open: false})}>
                Цуцлах
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteDialog.userId && deleteUser(deleteDialog.userId)}
              >
                Устгах
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}