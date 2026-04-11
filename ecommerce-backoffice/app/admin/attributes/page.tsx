"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Tags,
    Loader2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/attributes`;

interface Attribute {
    id: string;
    name: string;
    nameMn: string;
    values: string[] | string;
    createdAt: string;
}

export default function AttributesPage() {
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
    const [form, setForm] = useState({ name: "", nameMn: "", values: "" });
    const { toast } = useToast();

    const fetchAttributes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            const data = await response.json();
            setAttributes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch attributes", error);
            toast({
                title: "Алдаа",
                description: "Шинж чанаруудыг ачаалахад алдаа гарлаа.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttributes();
    }, []);

    const handleSave = async () => {
        if (!form.name || !form.nameMn) {
            toast({
                title: "Анхааруулга",
                description: "Нэр болон Монгол нэрийг заавал бөглөнө үү.",
                variant: "destructive",
            });
            return;
        }
        // Convert comma-separated values string to array for API
        const payload = {
            ...form,
            values: form.values ? form.values.split(',').map(v => v.trim()).filter(v => v) : [],
        };

        setIsSaving(true);
        try {
            const url = editingAttribute ? `${API_URL}/${editingAttribute.id}` : API_URL;
            const method = editingAttribute ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast({
                    title: "Амжилттай",
                    description: editingAttribute ? "Шинж чанарыг заслаа." : "Шинж чанар бүртгэгдлээ.",
                });
                setIsDialogOpen(false);
                fetchAttributes();
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast({
                title: "Алдаа",
                description: "Хадгалахад алдаа гарлаа.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Та энэ шинж чанарыг устгахдаа итгэлтэй байна уу?")) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            if (response.ok) {
                toast({
                    title: "Амжилттай",
                    description: "Шинж чанар устгагдлаа.",
                });
                fetchAttributes();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            toast({
                title: "Алдаа",
                description: "Устгахад алдаа гарлаа.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const openAddDialog = () => {
        setEditingAttribute(null);
        setForm({ name: "", nameMn: "", values: "" });
        setIsDialogOpen(true);
    };

    const openEditDialog = (attr: Attribute) => {
        setEditingAttribute(attr);
        const valuesStr = Array.isArray(attr.values) ? attr.values.join(', ') : (attr.values || '');
        setForm({ name: attr.name, nameMn: attr.nameMn, values: valuesStr });
        setIsDialogOpen(true);
    };

    const filteredAttributes = attributes.filter(attr =>
        attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attr.nameMn.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Шинж чанар</h1>
                    <p className="text-muted-foreground mt-1">Бүтээгдэхүүний үзүүлэлтүүдийн төрлийг удирдах</p>
                </div>
                <Button onClick={openAddDialog} className="gap-2 shadow-lg bg-primary hover:opacity-90 transition-all">
                    <Plus className="w-4 h-4" />
                    Шинэ шинж чанар нэмэх
                </Button>
            </div>

            {/* Stats Quick View */}
            <div className="grid gap-6 md:grid-cols-1">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-l-4 border-l-indigo-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Нийт төрөл</p>
                                <h3 className="text-2xl font-bold mt-1">{attributes.length}</h3>
                            </div>
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-600">
                                <Tags className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Table Section */}
            <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Хайх..."
                            className="pl-10 bg-background/50"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Монгол нэр (MN)</TableHead>
                                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">English Name (EN)</TableHead>
                                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Утгууд</TableHead>
                                <TableHead className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Огноо</TableHead>
                                <TableHead className="px-6 py-4 text-right font-semibold uppercase text-xs tracking-wider">Үйлдэл</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        <p className="mt-2 text-muted-foreground text-sm">Ачаалж байна...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredAttributes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                        Шинж чанар олдсонгүй.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAttributes.map((attr) => (
                                    <TableRow key={attr.id} className="hover:bg-muted/40 transition-colors group">
                                        <TableCell className="px-6 py-4 font-bold text-base">{attr.nameMn}</TableCell>
                                        <TableCell className="px-6 py-4 text-muted-foreground">{attr.name}</TableCell>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {(Array.isArray(attr.values) ? attr.values : (attr.values ? String(attr.values).split(',') : [])).slice(0, 5).map((v: string, i: number) => (
                                                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{v.trim()}</span>
                                                ))}
                                                {(Array.isArray(attr.values) ? attr.values : (attr.values ? String(attr.values).split(',') : [])).length > 5 && (
                                                    <span className="text-xs text-muted-foreground">+{(Array.isArray(attr.values) ? attr.values : String(attr.values).split(',')).length - 5} дахиад</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(attr.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-1">
                                                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Удирдлага</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openEditDialog(attr)} className="flex items-center gap-2 cursor-pointer py-2">
                                                        <Edit className="w-4 h-4" /> Засах
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(attr.id)} className="flex items-center gap-2 text-destructive cursor-pointer py-2 focus:bg-destructive focus:text-destructive-foreground">
                                                        <Trash2 className="w-4 h-4" /> Устгах
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingAttribute ? "Шинж чанар засах" : "Шинэ шинж чанар нэмэх"}</DialogTitle>
                        <DialogDescription>
                            Бүтээгдэхүүний үзүүлэлтийн төрлийг MN болон EN хэл дээр оруулна уу.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2 p-3 bg-muted/30 rounded-md">
                            <p className="text-xs text-muted-foreground">Утгуудыг таслалаар тусгаарлана. Жнь: S, M, L, XL</p>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="nameMn" className="text-sm font-medium">Монгол нэр (Жнь: Чанга яригч)</label>
                            <Input
                                id="nameMn"
                                value={form.nameMn}
                                onChange={(e) => setForm({ ...form, nameMn: e.target.value })}
                                placeholder="Монгол нэр"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="name" className="text-sm font-medium">English Name (e.g. Size)</label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="English Name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="values" className="text-sm font-medium">Утгууд (таслалаар тусгаарлана)</label>
                            <textarea
                                id="values"
                                value={form.values}
                                onChange={(e) => setForm({ ...form, values: e.target.value })}
                                placeholder="XS, S, M, L, XL, XXL"
                                rows={3}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Цуцлах</Button>
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingAttribute ? "Хадгалах" : "Нэмэх"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
