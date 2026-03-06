"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CUSTOMERS_API = `${API_BASE}/api/crm/customers`;
const DEALS_API = `${API_BASE}/api/crm/deals`;
const TASKS_API = `${API_BASE}/api/crm/tasks`;

interface Task {
  id: number;
  customer_id: number | null;
  deal_id: number | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  customer?: { name: string };
  deal?: { deal_name: string };
}

export default function CRMTasksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ data: Task[]; total: number; page: number; limit: number }>({ data: [], total: 0, page: 1, limit: 20 });
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [deals, setDeals] = useState<{ id: number; deal_name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formData, setFormData] = useState({ customer_id: "", deal_id: "", title: "", description: "", due_date: "", status: "pending" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    const res = await fetch(`${CUSTOMERS_API}?limit=500`);
    if (res.ok) { const d = await res.json(); setCustomers(d.data || d); }
  };
  const fetchDeals = async () => {
    const res = await fetch(`${DEALS_API}?limit=500`);
    if (res.ok) { const d = await res.json(); setDeals(d.data || d); }
  };
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${TASKS_API}?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); fetchDeals(); }, []);
  useEffect(() => { fetchTasks(); }, [page, statusFilter]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) { setError("Гарчиг заавал."); return; }
    try {
      setSaving(true);
      setError(null);
      const url = editing ? `${TASKS_API}/${editing.id}` : TASKS_API;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: formData.customer_id ? parseInt(formData.customer_id) : null,
          deal_id: formData.deal_id ? parseInt(formData.deal_id) : null,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: formData.due_date || null,
          status: formData.status,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      setSuccess(editing ? "Шинэчлэгдлээ" : "Нэмэгдлээ");
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ customer_id: "", deal_id: "", title: "", description: "", due_date: "", status: "pending" });
      fetchTasks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(`${TASKS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Устгагдлаа");
      fetchTasks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setFormData({
      customer_id: t.customer_id ? String(t.customer_id) : "",
      deal_id: t.deal_id ? String(t.deal_id) : "",
      title: t.title,
      description: t.description ?? "",
      due_date: t.due_date ?? "",
      status: t.status,
    });
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM - Даалгавар</h1>
        <Button onClick={() => { setEditing(null); setFormData({ customer_id: "", deal_id: "", title: "", description: "", due_date: "", status: "pending" }); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Нэмэх</Button>
      </div>
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error} <button onClick={() => setError(null)}>Хаах</button></div>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle>Жагсаалт ({data.total})</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Төлөв" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Бүгд</SelectItem>
                <SelectItem value="pending">Хүлээгдэж буй</SelectItem>
                <SelectItem value="completed">Дууссан</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : data.data.length === 0 ? <p className="text-center py-8 text-muted-foreground">Даалгавар олдсонгүй</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Гарчиг</TableHead>
                    <TableHead>Харилцагч</TableHead>
                    <TableHead>Гүйлгээ</TableHead>
                    <TableHead>Дуусах огноо</TableHead>
                    <TableHead>Төлөв</TableHead>
                    <TableHead className="w-28">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell>{t.customer?.name ?? "-"}</TableCell>
                      <TableCell>{t.deal?.deal_name ?? "-"}</TableCell>
                      <TableCell>{t.due_date ?? "-"}</TableCell>
                      <TableCell><Badge variant={t.status === "completed" ? "default" : "secondary"}>{t.status === "completed" ? "Дууссан" : "Хүлээгдэж буй"}</Badge></TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="ml-2 text-red-600" onClick={() => handleDelete(t.id)}><Trash className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Даалгавар засах" : "Шинэ даалгавар"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Гарчиг *</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
            <div><Label>Тайлбар</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
            <div><Label>Харилцагч</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Сонгох" /></SelectTrigger>
                <SelectContent><SelectItem value="">-</SelectItem>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Гүйлгээ</Label>
              <Select value={formData.deal_id} onValueChange={(v) => setFormData({ ...formData, deal_id: v })}>
                <SelectTrigger><SelectValue placeholder="Сонгох" /></SelectTrigger>
                <SelectContent><SelectItem value="">-</SelectItem>{deals.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.deal_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Дуусах огноо</Label><Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} /></div>
            <div><Label>Төлөв</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Хүлээгдэж буй</SelectItem><SelectItem value="completed">Дууссан</SelectItem></SelectContent>
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
