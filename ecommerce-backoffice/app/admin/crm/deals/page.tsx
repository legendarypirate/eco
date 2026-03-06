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
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CUSTOMERS_API = `${API_BASE}/api/crm/customers`;
const DEALS_API = `${API_BASE}/api/crm/deals`;

interface Deal {
  id: number;
  customer_id: number;
  deal_name: string;
  amount: number | string;
  status: string;
  customer?: { id: number; name: string; company_name?: string };
}

interface Customer { id: number; name: string; company_name?: string }

const statusLabels: Record<string, string> = { open: "Нээлттэй", won: "Хожсон", lost: "Хожигдсон" };

export default function CRMDealsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ data: Deal[]; total: number; page: number; limit: number }>({ data: [], total: 0, page: 1, limit: 20 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [formData, setFormData] = useState({ customer_id: "", deal_name: "", amount: "", status: "open" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${CUSTOMERS_API}?limit=500`);
      if (res.ok) { const d = await res.json(); setCustomers(d.data || d); }
    } catch (e) { console.error(e); }
  };

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (customerFilter) params.set("customer_id", customerFilter);
      const res = await fetch(`${DEALS_API}?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { fetchDeals(); }, [page, statusFilter, customerFilter]);

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.deal_name.trim()) { setError("Харилцагч болон гүйлгээний нэр заавал."); return; }
    try {
      setSaving(true);
      setError(null);
      const url = editing ? `${DEALS_API}/${editing.id}` : DEALS_API;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          deal_name: formData.deal_name.trim(),
          amount: formData.amount ? parseFloat(formData.amount) : 0,
          status: formData.status,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      setSuccess(editing ? "Шинэчлэгдлээ" : "Нэмэгдлээ");
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ customer_id: "", deal_name: "", amount: "", status: "open" });
      fetchDeals();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(`${DEALS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Устгагдлаа");
      fetchDeals();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const openEdit = (d: Deal) => {
    setEditing(d);
    setFormData({ customer_id: String(d.customer_id), deal_name: d.deal_name, amount: String(d.amount ?? ""), status: d.status });
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM - Гүйлгээ</h1>
        <Button onClick={() => { setEditing(null); setFormData({ customer_id: customerFilter || "", deal_name: "", amount: "", status: "open" }); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Нэмэх</Button>
      </div>
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error} <button onClick={() => setError(null)}>Хаах</button></div>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle>Жагсаалт ({data.total})</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Төлөв" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Бүгд</SelectItem>
                  <SelectItem value="open">Нээлттэй</SelectItem>
                  <SelectItem value="won">Хожсон</SelectItem>
                  <SelectItem value="lost">Хожигдсон</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Харилцагч" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Бүгд</SelectItem>
                  {customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : data.data.length === 0 ? <p className="text-center py-8 text-muted-foreground">Гүйлгээ олдсонгүй</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Гүйлгээний нэр</TableHead>
                    <TableHead>Харилцагч</TableHead>
                    <TableHead>Дүн</TableHead>
                    <TableHead>Төлөв</TableHead>
                    <TableHead className="w-28">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.deal_name}</TableCell>
                      <TableCell>{d.customer?.name ?? d.customer_id}</TableCell>
                      <TableCell>{Number(d.amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={d.status === "won" ? "default" : d.status === "lost" ? "destructive" : "secondary"}>{statusLabels[d.status] ?? d.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="ml-2 text-red-600" onClick={() => handleDelete(d.id)}><Trash className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && <div className="flex justify-center gap-2 mt-4"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Өмнөх</Button><span className="px-2 text-sm">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Дараах</Button></div>}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Гүйлгээ засах" : "Шинэ гүйлгээ"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Харилцагч *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Сонгох" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.company_name ? `(${c.company_name})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Гүйлгээний нэр *</Label><Input value={formData.deal_name} onChange={(e) => setFormData({ ...formData, deal_name: e.target.value })} /></div>
            <div><Label>Дүн</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} /></div>
            <div><Label>Төлөв</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Нээлттэй</SelectItem>
                  <SelectItem value="won">Хожсон</SelectItem>
                  <SelectItem value="lost">Хожигдсон</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
