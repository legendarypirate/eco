"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const CUSTOMERS_API = `${API_BASE}/api/crm/customers`;
const EMAILS_API = `${API_BASE}/api/crm/emails`;
const SELECT_NONE = "__none__";

interface EmailRecord {
  id: number;
  customer_id: number;
  subject: string | null;
  body: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
  customer?: { name: string; email?: string };
}

export default function CRMEmailsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ data: EmailRecord[]; total: number; page: number; limit: number }>({ data: [], total: 0, page: 1, limit: 20 });
  const [customers, setCustomers] = useState<{ id: number; name: string; email?: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailRecord | null>(null);
  const [formData, setFormData] = useState({ customer_id: "", subject: "", body: "", status: "draft" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCustomers = async () => {
    const res = await fetch(`${CUSTOMERS_API}?limit=500`);
    if (res.ok) { const d = await res.json(); setCustomers(d.data || d); }
  };
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (customerFilter) params.set("customer_id", customerFilter);
      const res = await fetch(`${EMAILS_API}?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { fetchEmails(); }, [page, statusFilter, customerFilter]);

  const handleSubmit = async () => {
    if (!formData.customer_id) { setError("Харилцагч заавал."); return; }
    try {
      setSaving(true);
      setError(null);
      const url = editing ? `${EMAILS_API}/${editing.id}` : EMAILS_API;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: parseInt(formData.customer_id),
          subject: formData.subject.trim() || null,
          body: formData.body.trim() || null,
          status: formData.status,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      setSuccess(editing ? "Шинэчлэгдлээ" : "Нэмэгдлээ");
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ customer_id: "", subject: "", body: "", status: "draft" });
      fetchEmails();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(`${EMAILS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Устгагдлаа");
      fetchEmails();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const openEdit = (e: EmailRecord) => {
    setEditing(e);
    setFormData({ customer_id: String(e.customer_id), subject: e.subject ?? "", body: e.body ?? "", status: e.status });
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;
  const statusLabels: Record<string, string> = { sent: "Илгээгдсэн", draft: "Ноорог", failed: "Алдаа" };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM - И-мэйл</h1>
        <Button onClick={() => { setEditing(null); setFormData({ customer_id: customerFilter || "", subject: "", body: "", status: "draft" }); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Нэмэх</Button>
      </div>
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error} <button onClick={() => setError(null)}>Хаах</button></div>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle>Жагсаалт ({data.total})</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter || SELECT_NONE} onValueChange={(v) => setStatusFilter(v === SELECT_NONE ? "" : v)}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Төлөв" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE}>Бүгд</SelectItem>
                  <SelectItem value="sent">Илгээгдсэн</SelectItem>
                  <SelectItem value="draft">Ноорог</SelectItem>
                  <SelectItem value="failed">Алдаа</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter || SELECT_NONE} onValueChange={(v) => setCustomerFilter(v === SELECT_NONE ? "" : v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Харилцагч" /></SelectTrigger>
                <SelectContent><SelectItem value={SELECT_NONE}>Бүгд</SelectItem>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : data.data.length === 0 ? <p className="text-center py-8 text-muted-foreground">И-мэйл олдсонгүй</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Гарчиг</TableHead>
                    <TableHead>Харилцагч</TableHead>
                    <TableHead>Төлөв</TableHead>
                    <TableHead>Илгээсэн</TableHead>
                    <TableHead className="w-28">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="max-w-xs truncate">{e.subject || "(Гарчиггүй)"}</TableCell>
                      <TableCell>{e.customer?.name ?? e.customer_id}</TableCell>
                      <TableCell><Badge variant={e.status === "sent" ? "default" : e.status === "failed" ? "destructive" : "secondary"}>{statusLabels[e.status] ?? e.status}</Badge></TableCell>
                      <TableCell>{e.sent_at ? new Date(e.sent_at).toLocaleString() : "-"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="ml-2 text-red-600" onClick={() => handleDelete(e.id)}><Trash className="h-4 w-4" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "И-мэйл засах" : "Шинэ и-мэйл"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Харилцагч *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Сонгох" /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name} {c.email ? `(${c.email})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Гарчиг</Label><Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="И-мэйлийн гарчиг" /></div>
            <div><Label>Агуулга</Label><Textarea value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} rows={5} /></div>
            <div><Label>Төлөв</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">Ноорог</SelectItem><SelectItem value="sent">Илгээгдсэн</SelectItem><SelectItem value="failed">Алдаа</SelectItem></SelectContent>
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
