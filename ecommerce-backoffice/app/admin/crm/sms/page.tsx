"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CUSTOMERS_API = `${API_BASE}/api/crm/customers`;
const SMS_API = `${API_BASE}/api/crm/sms`;

interface SmsMessage {
  id: number;
  customer_id: number;
  message: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  customer?: { name: string; phone?: string };
}

export default function CRMSmsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ data: SmsMessage[]; total: number; page: number; limit: number }>({ data: [], total: 0, page: 1, limit: 20 });
  const [customers, setCustomers] = useState<{ id: number; name: string; phone?: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SmsMessage | null>(null);
  const [formData, setFormData] = useState({ customer_id: "", message: "", status: "pending" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    const res = await fetch(`${CUSTOMERS_API}?limit=500`);
    if (res.ok) { const d = await res.json(); setCustomers(d.data || d); }
  };
  const fetchSms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (customerFilter) params.set("customer_id", customerFilter);
      const res = await fetch(`${SMS_API}?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { fetchSms(); }, [page, statusFilter, customerFilter]);

  const handleSubmit = async () => {
    if (!formData.customer_id || !formData.message.trim()) { setError("Харилцагч болон мессеж заавал."); return; }
    try {
      setSaving(true);
      setError(null);
      const url = editing ? `${SMS_API}/${editing.id}` : SMS_API;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          message: formData.message.trim(),
          status: formData.status,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      setSuccess(editing ? "Шинэчлэгдлээ" : "Нэмэгдлээ");
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ customer_id: "", message: "", status: "pending" });
      fetchSms();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(`${SMS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Устгагдлаа");
      fetchSms();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const openEdit = (s: SmsMessage) => {
    setEditing(s);
    setFormData({ customer_id: String(s.customer_id), message: s.message, status: s.status });
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;
  const statusLabels: Record<string, string> = { sent: "Илгээгдсэн", pending: "Хүлээгдэж буй", failed: "Алдаа" };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM - SMS</h1>
        <Button onClick={() => { setEditing(null); setFormData({ customer_id: customerFilter || "", message: "", status: "pending" }); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Нэмэх</Button>
      </div>
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error} <button onClick={() => setError(null)}>Хаах</button></div>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle>Жагсаалт ({data.total})</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Төлөв" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Бүгд</SelectItem>
                  <SelectItem value="sent">Илгээгдсэн</SelectItem>
                  <SelectItem value="pending">Хүлээгдэж буй</SelectItem>
                  <SelectItem value="failed">Алдаа</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Харилцагч" /></SelectTrigger>
                <SelectContent><SelectItem value="">Бүгд</SelectItem>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : data.data.length === 0 ? <p className="text-center py-8 text-muted-foreground">SMS олдсонгүй</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Мессеж</TableHead>
                    <TableHead>Харилцагч</TableHead>
                    <TableHead>Төлөв</TableHead>
                    <TableHead>Илгээсэн огноо</TableHead>
                    <TableHead className="w-28">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-xs truncate">{s.message}</TableCell>
                      <TableCell>{s.customer?.name ?? s.customer_id}</TableCell>
                      <TableCell><Badge variant={s.status === "sent" ? "default" : s.status === "failed" ? "destructive" : "secondary"}>{statusLabels[s.status] ?? s.status}</Badge></TableCell>
                      <TableCell>{s.sent_at ? new Date(s.sent_at).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="ml-2 text-red-600" onClick={() => handleDelete(s.id)}><Trash className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "SMS засах" : "Шинэ SMS"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Харилцагч *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Сонгох" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.phone ? `(${c.phone})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Мессеж *</Label><Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={3} /></div>
            <div><Label>Төлөв</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="pending">Хүлээгдэж буй</SelectItem><SelectItem value="sent">Илгээгдсэн</SelectItem><SelectItem value="failed">Алдаа</SelectItem></SelectContent>
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
