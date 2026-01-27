"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageSquare, Plus, Edit, Trash2, Search, Filter, Loader2, AlertCircle } from "lucide-react";

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const COMPLAINTS_API = `${API_URL}/api/complaints`;

// Complaint type
export interface ComplaintData {
  id?: number;
  employee_name: string;
  store_name: string;
  store_phone: string;
  content: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  resolved_comment?: string;
  created_at?: string;
  updated_at?: string;
}

// Complaint Form Component
function ComplaintForm({
  complaint,
  onSubmit,
  onCancel,
  isLoading
}: {
  complaint?: ComplaintData;
  onSubmit: (complaintData: Omit<ComplaintData, "id" | "created_at" | "updated_at">) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState<Omit<ComplaintData, "id" | "created_at" | "updated_at">>({
    employee_name: complaint?.employee_name || "",
    store_name: complaint?.store_name || "",
    store_phone: complaint?.store_phone || "",
    content: complaint?.content || "",
    status: complaint?.status || "pending",
    resolved_comment: complaint?.resolved_comment || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employee_name">Ажилтны нэр *</Label>
          <Input
            id="employee_name"
            value={form.employee_name}
            onChange={(e) => setForm({...form, employee_name: e.target.value})}
            placeholder="Ажилтны нэр"
            required
          />
        </div>

        <div>
          <Label htmlFor="store_name">Дэлгүүрийн нэр *</Label>
          <Input
            id="store_name"
            value={form.store_name}
            onChange={(e) => setForm({...form, store_name: e.target.value})}
            placeholder="Дэлгүүрийн нэр"
            required
          />
        </div>

        <div>
          <Label htmlFor="store_phone">Дэлгүүрийн утас *</Label>
          <Input
            id="store_phone"
            value={form.store_phone}
            onChange={(e) => setForm({...form, store_phone: e.target.value})}
            placeholder="99999999"
            required
          />
        </div>

        <div>
          <Label htmlFor="status">Төлөв *</Label>
          <Select
            value={form.status}
            onValueChange={(value: ComplaintData["status"]) => setForm({...form, status: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Хүлээгдэж байна</SelectItem>
              <SelectItem value="in_progress">Шийдвэрлэж байна</SelectItem>
              <SelectItem value="resolved">Шийдвэрлэгдсэн</SelectItem>
              <SelectItem value="closed">Хаагдсан</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="content">Гомдолын агуулга *</Label>
        <Textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm({...form, content: e.target.value})}
          placeholder="Гомдолын агуулгыг дэлгэрэнгүй бичнэ үү..."
          className="min-h-[120px]"
          required
        />
      </div>

      <div>
        <Label htmlFor="resolved_comment">Шийдвэрлэсэн тайлбар</Label>
        <Textarea
          id="resolved_comment"
          value={form.resolved_comment || ""}
          onChange={(e) => setForm({...form, resolved_comment: e.target.value})}
          placeholder="Шийдвэрлэсэн тайлбараа бичнэ үү..."
          className="min-h-[100px]"
        />
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
            complaint ? "Хадгалах" : "Бүртгэх"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<ComplaintData[]>([]);
  const [editingComplaint, setEditingComplaint] = useState<ComplaintData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, complaintId?: number}>({open: false});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Fetch complaints from API
  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = getAuthToken();
      const response = await fetch(COMPLAINTS_API, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        // If API doesn't exist yet, use empty array (for development)
        if (response.status === 404) {
          setComplaints([]);
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle different response formats
      let complaintsData: ComplaintData[] = [];
      if (Array.isArray(result)) {
        complaintsData = result;
      } else if (Array.isArray(result.data)) {
        complaintsData = result.data;
      } else if (result.success && Array.isArray(result.data)) {
        complaintsData = result.data;
      }
      
      setComplaints(complaintsData);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      // For development, use empty array if API doesn't exist
      setComplaints([]);
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Create complaint via API
  const createComplaint = async (complaintData: Omit<ComplaintData, "id" | "created_at" | "updated_at">) => {
    try {
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = getAuthToken();
      const response = await fetch(COMPLAINTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success || result.id) {
        const newComplaint: ComplaintData = {
          id: result.id || result.data?.id,
          ...complaintData,
          created_at: result.created_at || result.data?.created_at || new Date().toISOString(),
          updated_at: result.updated_at || result.data?.updated_at || new Date().toISOString(),
        };
        
        setComplaints([...complaints, newComplaint]);
        setShowForm(false);
        setSuccess("Гомдол амжилттай бүртгэгдлээ");
        setTimeout(() => fetchComplaints(), 500);
      } else {
        throw new Error(result.message || 'Failed to create complaint');
      }
    } catch (err) {
      console.error('Error creating complaint:', err);
      setError(err instanceof Error ? err.message : 'Гомдол бүртгэхэд алдаа гарлаа');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Update complaint via API
  const updateComplaint = async (complaintData: Omit<ComplaintData, "id" | "created_at" | "updated_at">) => {
    try {
      if (!editingComplaint || !editingComplaint.id) return;
      
      setIsFormLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = getAuthToken();
      const response = await fetch(`${COMPLAINTS_API}/${editingComplaint.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success || result.id) {
        const updatedComplaints = complaints.map(complaint => 
          complaint.id === editingComplaint.id 
            ? { 
                ...complaint,
                ...complaintData,
                updated_at: result.updated_at || result.data?.updated_at || new Date().toISOString()
              }
            : complaint
        );
        
        setComplaints(updatedComplaints);
        setEditingComplaint(null);
        setShowForm(false);
        setSuccess("Гомдол амжилттай шинэчлэгдлээ");
        setTimeout(() => fetchComplaints(), 500);
      } else {
        throw new Error(result.message || 'Failed to update complaint');
      }
    } catch (err) {
      console.error('Error updating complaint:', err);
      setError(err instanceof Error ? err.message : 'Гомдол шинэчлэхэд алдаа гарлаа');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Delete complaint via API
  const deleteComplaint = async (complaintId: number) => {
    try {
      setError(null);
      setSuccess(null);
      
      const token = getAuthToken();
      const response = await fetch(`${COMPLAINTS_API}/${complaintId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success || response.ok) {
        setComplaints(complaints.filter(complaint => complaint.id !== complaintId));
        setDeleteDialog({open: false});
        setSuccess("Гомдол амжилттай устгагдлаа");
        setTimeout(() => fetchComplaints(), 500);
      } else {
        throw new Error(result.message || 'Failed to delete complaint');
      }
    } catch (err) {
      console.error('Error deleting complaint:', err);
      setError(err instanceof Error ? err.message : 'Гомдол устгахад алдаа гарлаа');
    }
  };

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = 
      complaint.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.store_phone.includes(searchTerm) ||
      complaint.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (complaint.resolved_comment && complaint.resolved_comment.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || complaint.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "pending").length,
    inProgress: complaints.filter(c => c.status === "in_progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    closed: complaints.filter(c => c.status === "closed").length,
  };

  const getStatusColor = (status: ComplaintData["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: ComplaintData["status"]) => {
    switch (status) {
      case "pending":
        return "Хүлээгдэж байна";
      case "in_progress":
        return "Шийдвэрлэж байна";
      case "resolved":
        return "Шийдвэрлэгдсэн";
      case "closed":
        return "Хаагдсан";
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Гомдлын мэдээлэл уншиж байна...</p>
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
          <h2 className="text-2xl font-semibold">Гомдол бүртгэл</h2>
          <p className="text-gray-600">Санал гомдлын бүртгэл, удирдлага</p>
        </div>
        <Button 
          onClick={() => { setEditingComplaint(null); setShowForm(true); setError(null); }}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Шинэ гомдол бүртгэх
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div className="flex-1 text-sm text-red-800">{error}</div>
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
            <div className="flex-1 text-sm text-green-800">{success}</div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Нийт гомдол</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Бүх гомдол
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хүлээгдэж байна</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Шийдвэрлэх хүлээж байна
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Шийдвэрлэж байна</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Одоогоор шийдвэрлэж байна
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Шийдвэрлэгдсэн</CardTitle>
            <AlertCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Амжилттай шийдвэрлэгдсэн
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Хаагдсан</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            <p className="text-xs text-muted-foreground">
              Хаагдсан гомдол
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
                  placeholder="Ажилтны нэр, дэлгүүрийн нэр, утас, агуулгаар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select 
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Төлөв" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх төлөв</SelectItem>
                  <SelectItem value="pending">Хүлээгдэж байна</SelectItem>
                  <SelectItem value="in_progress">Шийдвэрлэж байна</SelectItem>
                  <SelectItem value="resolved">Шийдвэрлэгдсэн</SelectItem>
                  <SelectItem value="closed">Хаагдсан</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingComplaint ? "Гомдол засах" : "Шинэ гомдол бүртгэх"}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ComplaintForm
              complaint={editingComplaint || undefined}
              onSubmit={editingComplaint ? updateComplaint : createComplaint}
              onCancel={() => { setShowForm(false); setEditingComplaint(null); }}
              isLoading={isFormLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Гомдлын жагсаалт</span>
            <span className="text-sm text-muted-foreground">
              {filteredComplaints.length} гомдол
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Ажилтны нэр</th>
                  <th className="text-left p-3">Дэлгүүрийн нэр</th>
                  <th className="text-left p-3">Дэлгүүрийн утас</th>
                  <th className="text-left p-3">Гомдолын агуулга</th>
                  <th className="text-left p-3">Төлөв</th>
                  <th className="text-left p-3">Шийдвэрлэсэн тайлбар</th>
                  <th className="text-left p-3">Бүртгэсэн огноо</th>
                  <th className="text-left p-3">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{complaint.employee_name}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{complaint.store_name}</div>
                    </td>
                    <td className="p-3">
                      <div>{complaint.store_phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="max-w-md truncate" title={complaint.content}>
                        {complaint.content}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(complaint.status)}>
                        {getStatusLabel(complaint.status)}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="max-w-md truncate" title={complaint.resolved_comment || ""}>
                        {complaint.resolved_comment || "-"}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs">{formatDate(complaint.created_at)}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingComplaint(complaint); setShowForm(true); setError(null); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => complaint.id && setDeleteDialog({open: true, complaintId: complaint.id})}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredComplaints.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Гомдол олдсонгүй
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
            <DialogTitle>Гомдол устгах уу?</DialogTitle>
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
                onClick={() => deleteDialog.complaintId && deleteComplaint(deleteDialog.complaintId)}
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

