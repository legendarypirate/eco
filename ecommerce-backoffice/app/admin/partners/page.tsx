"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash, Upload, X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgpk9aqnc';
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

interface Partner {
  id: string;
  name: string;
  logo: string;
  websiteUrl: string | null;
  order: number;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function PartnersPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    websiteUrl: "",
    order: 0,
    isActive: true,
  });

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/partners`;

  // Get auth token from localStorage
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Upload logo to Cloudinary
  const uploadToCloudinary = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'partners');
      formData.append('tags', 'partner_logo');

      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  // Handle logo file upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Зөвхөн зураг файл оруулна уу');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Зурагны хэмжээ 5MB-аас их байж болохгүй');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const imageUrl = await uploadToCloudinary(file);
      setFormData({ ...formData, logo: imageUrl });
      setSuccess('Лого амжилттай орууллаа');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError(err instanceof Error ? err.message : 'Лого оруулахад алдаа гарлаа');
    } finally {
      setUploading(false);
    }
  };

  // Fetch all partners
  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      const response = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPartners(data || []);
    } catch (err) {
      console.error('Error fetching partners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!formData.name || !formData.logo) {
        setError('Нэр болон лого заавал шаардлагатай');
        setSaving(false);
        return;
      }

      const token = getAuthToken();
      const url = editingPartner ? `${API_URL}/${editingPartner.id}` : API_URL;
      const method = editingPartner ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          logo: formData.logo,
          website_url: formData.websiteUrl || null,
          order: parseInt(formData.order.toString()) || 0,
          is_active: formData.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      setSuccess(editingPartner ? 'Хамтрагч амжилттай шинэчлэгдлээ' : 'Хамтрагч амжилттай нэмэгдлээ');
      setIsDialogOpen(false);
      resetForm();
      await fetchPartners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving partner:', err);
      setError(err instanceof Error ? err.message : 'Failed to save partner');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Та энэ хамтрагчийг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess('Хамтрагч амжилттай устгагдлаа');
      await fetchPartners();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting partner:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete partner');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      logo: "",
      websiteUrl: "",
      order: 0,
      isActive: true,
    });
    setEditingPartner(null);
  };

  // Open dialog for editing
  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo: partner.logo,
      websiteUrl: partner.websiteUrl || "",
      order: partner.order,
      isActive: partner.isActive,
    });
    setIsDialogOpen(true);
  };

  // Open dialog for creating
  const handleCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Initial fetch
  useEffect(() => {
    fetchPartners();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Хамтрагчдыг уншиж байна...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Хамтран ажиллагсад</h1>
          <p className="text-gray-600">Хамтрагчдын лого болон вэбсайт хаягийг удирдах</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Хамтрагч нэмэх
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Хаах
          </button>
        </div>
      )}

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Хамтрагчдын жагсаалт ({partners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Хамтрагч байхгүй байна. Шинэ хамтрагч нэмэх үү?
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Лого</TableHead>
                    <TableHead>Нэр</TableHead>
                    <TableHead>Вэбсайт</TableHead>
                    <TableHead className="w-24">Дараалал</TableHead>
                    <TableHead className="w-24">Төлөв</TableHead>
                    <TableHead className="w-32">Үйлдлүүд</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="w-16 h-16 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.jpg';
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        {partner.websiteUrl ? (
                          <a
                            href={partner.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {partner.websiteUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{partner.order}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          partner.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {partner.isActive ? 'Идэвхтэй' : 'Идэвхгүй'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(partner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(partner.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Хамтрагч засах' : 'Шинэ хамтрагч нэмэх'}
            </DialogTitle>
            <DialogDescription>
              Хамтрагчийн мэдээллийг оруулна уу
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Нэр *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Хамтрагчийн нэр"
              />
            </div>

            <div>
              <Label htmlFor="logo">Лого *</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {uploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                </div>
                {formData.logo && (
                  <div className="mt-2">
                    <img
                      src={formData.logo}
                      alt="Preview"
                      className="w-32 h-32 object-contain border rounded p-2"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, logo: "" })}
                      className="mt-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Лого устгах
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Зөвхөн зураг файл (PNG, JPG, GIF). Хамгийн ихдээ 5MB
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="websiteUrl">Вэбсайт хаяг (сонголттой)</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="order">Дараалал</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Бага тоо эхэнд харагдана
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Идэвхтэй
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Цуцлах
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                'Хадгалах'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

