"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CUSTOMERS_API = `${API_BASE}/api/crm/customers`;
const CONTACTS_API = `${API_BASE}/api/crm/contacts`;

interface Contact {
  id: number;
  customer_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  customer?: { id: number; name: string; company_name?: string };
}

interface Customer { id: number; name: string; company_name?: string }

export default function CRMContactsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ data: Contact[]; total: number; page: number; limit: number }>({ data: [], total: 0, page: 1, limit: 20 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ customer_id: "", name: "", email: "", phone: "", position: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${CUSTOMERS_API}?limit=500`);
      if (res.ok) {
        const d = await res.json();
        setCustomers(d.data || d);
      }
    } catch (e) { console.error(e); }
  };

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (customerFilter) params.set("customer_id", customerFilter);
      const res = await fetch(`${CONTACTS_API}?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [page, customerFilter]);

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.name.trim()) {
      setError("Харилцагч болон нэр заавал.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const url = editing ? `${CONTACTS_API}/${editing.id}` : CONTACTS_API;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          position: formData.position.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      setSuccess(editing ? "Шинэчлэгдлээ" : "Нэмэгдлээ");
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ customer_id: "", name: "", email: "", phone: "", position: "" });
      fetchContacts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(`${CONTACTS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Устгагдлаа");
      fetchContacts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const openEdit = (c: Contact) => {
    setEditing(c);
    setFormData({
      customer_id: String(c.customer_id),
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      position: c.position ?? "",
    });
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM - Холбоо барих</h1>
        <Button onClick={() => { setEditing(null); setFormData({ customer_id: customerFilter || "", name: "", email: "", phone: "", position: "" }); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Нэмэх
        </Button>
      </div>
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error} <button onClick={() => setError(null)}>Хаах</button></div>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle>Жагсаалт ({data.total})</CardTitle>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Харилцагчаар шүүх" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Бүгд</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company_name ? `(${c.company_name})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : data.data.length === 0 ? <p className="text-center py-8 text-muted-foreground">Холбоо барих олдсонгүй</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Нэр</TableHead>
                    <TableHead>И-мэйл</TableHead>
                    <TableHead>Утас</TableHead>
                    <TableHead>Албан тушаал</TableHead>
                    <TableHead>Харилцагч</TableHead>
                    <TableHead className="w-28">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.email ?? "-"}</TableCell>
                      <TableCell>{c.phone ?? "-"}</TableCell>
                      <TableCell>{c.position ?? "-"}</TableCell>
                      <TableCell>{c.customer?.name ?? c.customer_id}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="ml-2 text-red-600" onClick={() => handleDelete(c.id)}><Trash className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Өмнөх</Button>
                <span className="px-2 text-sm">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Дараах</Button>
              </div>}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Засах" : "Шинэ холбоо барих"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Харилцагч *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Сонгох" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company_name ? `(${c.company_name})` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Нэр *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>И-мэйл</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div><Label>Утас</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div><Label>Албан тушаал</Label><Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Цуцлах</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Хадгалах"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
