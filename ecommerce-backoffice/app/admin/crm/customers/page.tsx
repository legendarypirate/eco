"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/crm/customers`;

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company_name: string | null;
  company_contact_person: string | null;
  company_email: string | null;
  company_phone: string | null;
  created_at?: string;
  updated_at?: string;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  company_name: "",
  company_contact_person: "",
  company_email: "",
  company_phone: "",
};

export default function CRMCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ data: Customer[]; total: number; page: number; limit: number }>({ data: [], total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${API_URL}?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchCustomers();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Нэр заавал.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const url = editing ? `${API_URL}/${editing.id}` : API_URL;
      const method = editing ? "PUT" : "POST";
      const body = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        company_name: formData.company_name.trim() || null,
        company_contact_person: formData.company_contact_person.trim() || null,
        company_email: formData.company_email.trim() || null,
        company_phone: formData.company_phone.trim() || null,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save");
      }
      setSuccess(editing ? "Шинэчлэгдлээ" : "Нэмэгдлээ");
      setIsDialogOpen(false);
      setEditing(null);
      setFormData(emptyForm);
      fetchCustomers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Устгагдлаа");
      fetchCustomers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setFormData({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      company_name: c.company_name ?? "",
      company_contact_person: c.company_contact_person ?? "",
      company_email: c.company_email ?? "",
      company_phone: c.company_phone ?? "",
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const handleImport = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Excel (.xlsx, .xls) файл оруулна уу.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setImporting(true);
      setError(null);
      const res = await fetch(`${API_URL}/import`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Импорт хийхэд алдаа гарлаа");
      }
      setSuccess("Харилцагчдыг амжилттай импортоллоо.");
      fetchCustomers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Импорт хийхэд алдаа гарлаа");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">CRM - Харилцагчид</h1>
          <p className="text-muted-foreground">Нэр, и-мэйл, компанийн нэрээр хайх</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Нэмэх
          </Button>
          <label className="flex items-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
            <Button type="button" variant="outline" className="flex items-center gap-2">
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Excel импорт
            </Button>
          </label>
        </div>
      </div>

      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:underline">Хаах</button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle>Жагсаалт ({data.total})</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Нэр, и-мэйл, компани..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="max-w-xs"
              />
              <Button variant="outline" onClick={handleSearch}>Хайх</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.data.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Харилцагч олдсонгүй</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Нэр</TableHead>
                      <TableHead>И-мэйл</TableHead>
                      <TableHead>Утас</TableHead>
                      <TableHead>Компани</TableHead>
                      <TableHead className="w-28">Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.email ?? "-"}</TableCell>
                        <TableCell>{c.phone ?? "-"}</TableCell>
                        <TableCell>{c.company_name ?? "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(c.id)}><Trash className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Өмнөх</Button>
                  <span className="flex items-center px-2 text-sm">Хуудас {page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Дараах</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Харилцагч засах" : "Шинэ харилцагч"}</DialogTitle>
            <DialogDescription>Харилцагч болон компанийн мэдээлэл</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Нэр *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Нэр" />
            </div>
            <div className="space-y-2">
              <Label>И-мэйл</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Утас</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Утас" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Хаяг</Label>
              <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Хаяг" />
            </div>
            <div className="space-y-2">
              <Label>Компанийн нэр</Label>
              <Input value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} placeholder="Компани" />
            </div>
            <div className="space-y-2">
              <Label>Компанийн холбоо барих хүн</Label>
              <Input value={formData.company_contact_person} onChange={(e) => setFormData({ ...formData, company_contact_person: e.target.value })} placeholder="Нэр" />
            </div>
            <div className="space-y-2">
              <Label>Компанийн и-мэйл</Label>
              <Input type="email" value={formData.company_email} onChange={(e) => setFormData({ ...formData, company_email: e.target.value })} placeholder="email@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Компанийн утас</Label>
              <Input value={formData.company_phone} onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })} placeholder="Утас" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Цуцлах</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Хадгалах"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
