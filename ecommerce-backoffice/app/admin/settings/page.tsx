"use client";

import { useState, useEffect } from "react";
import {
    Save,
    Upload,
    X,
    Type,
    FileText,
    Globe,
    Mail,
    Phone,
    MapPin,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [settings, setSettings] = useState({
        id: "",
        title: "",
        logo: "",
        footerText: "",
        contactEmail: "",
        contactPhone: "",
        address: ""
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("http://localhost:3001/api/settings");
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                    setLogoPreview(data.logo);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
                // In a real app, you'd upload this to a server and get a URL back
                // For now, we'll just store the base64 or a mock path
                setSettings(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage(null);

        try {
            const response = await fetch("http://localhost:3001/api/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setSuccessMessage("Тохиргоо амжилттай хадгалагдлаа!");
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (error) {
            console.error("Failed to save settings", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Ерөнхий тохиргоо</h1>
                <p className="text-muted-foreground mt-1">Вэбсайтын үндсэн мэдээлэл болон харагдах байдлыг тохируулах</p>
            </div>

            {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-medium text-sm">{successMessage}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Site Identity */}
                    <Card className="lg:col-span-1 border-none shadow-xl bg-card/50 backdrop-blur-sm h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-primary" />
                                Системийн таних тэмдэг
                            </CardTitle>
                            <CardDescription>Лого болон нэр</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Вэбсайтын лого</Label>
                                <div className="relative aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center p-4 bg-muted/20 group hover:border-primary/30 transition-all">
                                    {logoPreview ? (
                                        <>
                                            <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain p-2" />
                                            <button
                                                type="button"
                                                onClick={() => { setLogoPreview(null); setSettings(p => ({ ...p, logo: "" })); }}
                                                className="absolute top-2 right-2 p-1.5 bg-destructive/10 text-destructive rounded-full hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center space-y-2">
                                            <div className="p-3 bg-primary/10 rounded-full inline-block text-primary">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <div className="text-xs text-muted-foreground">PNG, SVG (Max 1MB)</div>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-semibold">Вэбсайтын гарчиг</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={settings.title}
                                    onChange={handleInputChange}
                                    placeholder="Жишээ: Outdoorworld Shop"
                                    className="bg-background/50"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact & Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Footer-ийн мэдээлэл
                                </CardTitle>
                                <CardDescription>Хуудасны доод хэсэгт харагдах текст</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-2">
                                    <Label htmlFor="footerText" className="text-sm font-semibold">Footer текст (Copyright)</Label>
                                    <Textarea
                                        id="footerText"
                                        name="footerText"
                                        value={settings.footerText}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="bg-background/50 resize-none"
                                        placeholder="© 2025 Бүх эрх хуулиар хамгаалагдсан."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary" />
                                    Холбоо барих мэдээлэл
                                </CardTitle>
                                <CardDescription>Вэбсайт дээр харагдах холбоо барих сувгууд</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail" className="text-sm font-semibold flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        Имэйл хаяг
                                    </Label>
                                    <Input
                                        id="contactEmail"
                                        name="contactEmail"
                                        value={settings.contactEmail}
                                        onChange={handleInputChange}
                                        placeholder="info@yourstore.mn"
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone" className="text-sm font-semibold flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        Утасны дугаар
                                    </Label>
                                    <Input
                                        id="contactPhone"
                                        name="contactPhone"
                                        value={settings.contactPhone}
                                        onChange={handleInputChange}
                                        placeholder="+976 8808XXXX"
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        Хаяг байршил
                                    </Label>
                                    <Input
                                        id="address"
                                        name="address"
                                        value={settings.address}
                                        onChange={handleInputChange}
                                        placeholder="Улаанбаатар хот, Сүхбаатар дүүрэг..."
                                        className="bg-background/50"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="px-12 h-12 bg-primary hover:opacity-90 shadow-xl shadow-primary/20 flex items-center gap-2 font-bold transition-all hover:scale-105"
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {isSaving ? 'Хадгалж байна...' : 'Тохиргоог хадгалах'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
