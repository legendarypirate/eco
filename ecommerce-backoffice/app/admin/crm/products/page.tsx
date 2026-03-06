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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PRODUCTS_API = `${API_BASE}/api/crm/products`;

interface CrmProduct {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  created_at?: string;
}

export default function CRMProductsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<{ data: CrmProduct[]; total: number; page: number; limit: number }>({ data: [], total: 0, page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CrmProduct | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", price: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`${PRODUCTS_API}?${params}`);
      if (res.ok) setData(await res.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleSearch = () => { setPage(1); fetchProducts(); };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { setError("Нэр заавал."); return; }
    try {
      setSaving(true);
      setError(null);
      const url = editing ? `${PRODUCTS_API}/${editing.id}` : PRODUCTS_API;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: formData.price ? parseFloat(formData.price) : 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed");
      setSuccess(editing ? "Шинэчлэгдлээ" : "Нэмэгдлээ");
      setIsDialogOpen(false);
      setEditing(null);
      setFormData({ name: "", description: "", price: "" });
      fetchProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Устгах уу?")) return;
    try {
      const res = await fetch(`${PRODUCTS_API}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Устгагдлаа");
      fetchProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  };

  const openEdit = (p: CrmProduct) => {
    setEditing(p);
    setFormData({ name: p.name, description: p.description ?? "", price: String(p.price ?? "") });
    setIsDialogOpen(true);
  };

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">CRM - Бүтээгдэхүүн</h1>
        <Button onClick={() => { setEditing(null); setFormData({ name: "", description: "", price: "" }); setIsDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Нэмэх</Button>
      </div>
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error} <button onClick={() => setError(null)}>Хаах</button></div>}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle>Жагсаалт ({data.total})</CardTitle>
            <div className="flex gap-2">
              <Input placeholder="Нэрээр хайх" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="max-w-xs" />
              <Button variant="outline" onClick={handleSearch}>Хайх</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : data.data.length === 0 ? <p className="text-center py-8 text-muted-foreground">Бүтээгдэхүүн олдсонгүй</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Нэр</TableHead>
                    <TableHead>Тайлбар</TableHead>
                    <TableHead>Үнэ</TableHead>
                    <TableHead className="w-28">Үйлдэл</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{p.description ?? "-"}</TableCell>
                      <TableCell>{Number(p.price).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="ml-2 text-red-600" onClick={() => handleDelete(p.id)}><Trash className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? "Бүтээгдэхүүн засах" : "Шинэ бүтээгдэхүүн"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>Нэр *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div><Label>Тайлбар</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} /></div>
            <div><Label>Үнэ</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
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
