"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Upload,
    X,
    Type,
    Link as LinkIcon,
    FileText,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function NewBrandPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        isActive: true
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Auto-generate slug from name if slug is empty
            ...(name === "name" && !prev.slug ? { slug: value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') } : {})
        }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Logic to send to API: POST /api/brands
        /*
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('slug', formData.slug);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('isActive', String(formData.isActive));
        if (logoFile) formDataToSend.append('logo', logoFile);
    
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/brands`, {
            method: 'POST',
            body: formDataToSend
          });
          if (response.ok) router.push("/admin/brands");
        } catch (error) {
           console.error(error);
        }
        */

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push("/admin/brands");
        }, 1000);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Back Button & Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/brands">
                        <Button variant="outline" size="icon" className="rounded-full h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Шинэ брэнд нэмэх</h1>
                        <p className="text-muted-foreground mt-1">Системд шинээр брэнд бүртгэх</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Logo Upload Section */}
                    <Card className="md:col-span-1 border-none shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden h-fit">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Upload className="w-5 h-5 text-primary" />
                                Лого
                            </CardTitle>
                            <CardDescription>Брэндийн логог энд хуулна уу</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-4 overflow-hidden ${logoPreview ? 'border-primary/50' : 'border-muted-foreground/20 hover:border-primary/30 bg-muted/20'
                                    }`}
                            >
                                {logoPreview ? (
                                    <>
                                        <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-4" />
                                        <button
                                            type="button"
                                            onClick={() => setLogoPreview(null)}
                                            className="absolute top-2 right-2 p-1 bg-destructive/10 text-destructive rounded-full hover:bg-destructive hover:text-white transition-all shadow-sm"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center space-y-2">
                                        <div className="p-3 bg-primary/10 rounded-full inline-block text-primary">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-semibold">Лого сонгох</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, SVG (Max 2MB)</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground text-center">
                                Цагаан дэвсгэртэй эсвэл тунгалаг PNG лого ашиглахыг зөвлөж байна.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Core Information Section */}
                    <Card className="md:col-span-2 border-none shadow-xl bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b bg-muted/10">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                Үндсэн мэдээлэл
                            </CardTitle>
                            <CardDescription>Брэндийн нэр болон ерөнхий мэдээлэл</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                                        <Type className="w-4 h-4 text-muted-foreground" />
                                        Брэндийн нэр
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Жишээ: Apple, Samsung..."
                                        className="h-11 bg-background/50 focus:ring-primary/20"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-sm font-semibold flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                        Slug (URL)
                                    </Label>
                                    <Input
                                        id="slug"
                                        name="slug"
                                        placeholder="Жишээ: apple-inc-2024"
                                        className="h-11 bg-background/50 font-mono text-sm"
                                        value={formData.slug}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    Тайлбар
                                </Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Брэндийн тухай товч мэдээлэл..."
                                    className="min-h-[120px] bg-background/50 resize-none focus:ring-primary/20"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="pt-4 border-t flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold flex items-center gap-2">
                                        <CheckCircle2 className={`w-5 h-5 ${formData.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                        Брэндийн төлөв
                                    </Label>
                                    <p className="text-sm text-muted-foreground italic">
                                        Хаасан тохиолдолд уг брэнд барааны шүүлтүүрт харагдахгүй.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                    className="data-[state=checked]:bg-emerald-500 shadow-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-4 pb-10">
                    <Link href="/admin/brands">
                        <Button variant="ghost" className="px-8 h-12 text-muted-foreground hover:bg-muted font-medium transition-all">
                            Цуцлах
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="px-10 h-12 bg-primary hover:opacity-90 shadow-xl shadow-primary/20 flex items-center gap-2 font-bold transition-all hover:scale-105"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isLoading ? 'Хадгалж байна...' : 'Брэнд хадгалах'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
