"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    ExternalLink,
    Tags,
    CheckCircle2,
    XCircle,
    Image as ImageIcon
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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock data based on the model
const INITIAL_BRANDS = [
    {
        id: "1",
        name: "Apple",
        slug: "apple",
        logo: "/assets/brand/apple.png",
        description: "Think Different.",
        isActive: true,
        productCount: 45,
        updatedAt: "2024-02-20T10:00:00Z"
    },
    {
        id: "2",
        name: "Samsung",
        slug: "samsung",
        logo: "/assets/brand/samsung.png",
        description: "Better Tomorrow.",
        isActive: true,
        productCount: 120,
        updatedAt: "2024-02-19T15:30:00Z"
    },
    {
        id: "3",
        name: "Sony",
        slug: "sony",
        logo: "/assets/brand/sony.png",
        description: "Make.Believe",
        isActive: false,
        productCount: 12,
        updatedAt: "2024-02-18T09:12:00Z"
    }
];

export default function BrandsPage() {
    const [brands, setBrands] = useState(INITIAL_BRANDS);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // In a real app, you would fetch from API: GET /api/brands
    /*
    useEffect(() => {
      const fetchBrands = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands`);
          const data = await response.json();
          setBrands(data);
        } catch (error) {
          console.error("Failed to fetch brands", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBrands();
    }, []);
    */

    const filteredBrands = brands.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Брэндүүд</h1>
                    <p className="text-muted-foreground mt-1">Нийт бүртгэлтэй брэндүүдийн жагсаалт болон удирдлага</p>
                </div>
                <Link href="/admin/brands/new">
                    <Button className="gap-2 shadow-lg bg-primary hover:opacity-90 transition-all">
                        <Plus className="w-4 h-4" />
                        Шинэ брэнд нэмэх
                    </Button>
                </Link>
            </div>

            {/* Stats Quick View */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-l-4 border-l-indigo-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Нийт брэнд</p>
                                <h3 className="text-2xl font-bold mt-1">{brands.length}</h3>
                            </div>
                            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-600">
                                <Tags className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-l-4 border-l-emerald-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Идэвхтэй</p>
                                <h3 className="text-2xl font-bold mt-1">{brands.filter(b => b.isActive).length}</h3>
                            </div>
                            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500/10 to-red-500/10 border-l-4 border-l-orange-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Идэвхгүй</p>
                                <h3 className="text-2xl font-bold mt-1">{brands.filter(b => !b.isActive).length}</h3>
                            </div>
                            <div className="p-3 bg-orange-500/20 rounded-xl text-orange-600">
                                <XCircle className="w-6 h-6" />
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
                            placeholder="Брэнд хайх..."
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
                                <TableHead className="px-6 py-4 font-semibold">Лого & Нэр</TableHead>
                                <TableHead className="px-6 py-4 font-semibold">Slug</TableHead>
                                <TableHead className="px-6 py-4 font-semibold">Бүтээгдэхүүн</TableHead>
                                <TableHead className="px-6 py-4 font-semibold">Төлөв</TableHead>
                                <TableHead className="px-6 py-4 font-semibold">Сүүлд зассан</TableHead>
                                <TableHead className="px-6 py-4 text-right font-semibold">Үйлдэл</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBrands.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                        Брэнд олдсонгүй.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBrands.map((brand) => (
                                    <TableRow key={brand.id} className="hover:bg-muted/40 transition-colors group">
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-muted-foreground/10 group-hover:scale-105 transition-transform duration-300">
                                                    {brand.logo ? (
                                                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1" />
                                                    ) : (
                                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-base">{brand.name}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{brand.description}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{brand.slug}</code>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge variant="secondary" className="font-medium">
                                                {brand.productCount} бараа
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4">
                                            {brand.isActive ? (
                                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
                                                    Идэвхтэй
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">
                                                    Идэвхгүй
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                                            {new Date(brand.updatedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors">
                                                        <MoreHorizontal className="h-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-1">
                                                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                        Удирдлага
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/brands/edit/${brand.id}`} className="flex items-center gap-2 cursor-pointer py-2">
                                                            <Edit className="w-4 h-4" /> Засах
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer py-2">
                                                        <ExternalLink className="w-4 h-4" /> Харах
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="flex items-center gap-2 text-destructive cursor-pointer py-2 focus:bg-destructive focus:text-destructive-foreground">
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
        </div>
    );
}
